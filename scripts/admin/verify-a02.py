"""Exercise the real local API. Creates isolated demo data; never prints credentials."""
import argparse
import json
import secrets
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--credentials-file', required=True)
parser.add_argument('--base-url', default='http://localhost:8080/api/v1')
parser.add_argument('--results-file', default='docs/admin/A0.2-API-RESULTS.json')
args = parser.parse_args()
credential_path = Path(args.credentials_file)
credentials = json.loads(credential_path.read_text())
results = []


def check(name, expected, method, path, token=None, payload=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    request = urllib.request.Request(args.base_url + path, method=method, headers=headers,
                                     data=None if payload is None else json.dumps(payload).encode())
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            status, raw = response.status, response.read()
    except urllib.error.HTTPError as error:
        status, raw = error.code, error.read()
    result = {'check': name, 'expected': expected, 'actual': status,
              'result': 'PASS' if status == expected else 'FAIL'}
    results.append(result)
    print(f"{result['result']}: {name} (HTTP {status})")
    assert status == expected, name
    return json.loads(raw) if raw else None


def login(account):
    return check('Login ' + account['email'], 200, 'POST', '/auth/login', payload={
        'email': account['email'], 'password': account['password']})['accessToken']


try:
    root = login(credentials)
    owner_accounts = check('Super admin lists managed accounts', 200, 'GET', '/admin/accounts', root)
    credentials['id'] = next(a['id'] for a in owner_accounts if a['email'] == credentials['email'])
    credential_path.write_text(json.dumps(credentials, indent=2))
    check('Anonymous admin access denied', 401, 'GET', '/admin/brands')
    check('Last active super admin protected', 409, 'PATCH',
          f"/admin/accounts/{credentials['id']}/status", root, {'status': 'DISABLED'})
    suffix = secrets.token_hex(4)
    secondary = {'email': f'a02-second-{suffix}@brandista.local', 'password': secrets.token_urlsafe(24)}
    second = check('Super admin creates another super admin', 201, 'POST', '/admin/accounts', root,
                   {**secondary, 'role': 'SUPER_ADMIN', 'brandIds': []})
    second_token = login(secondary)
    check('Second super admin has platform access', 200, 'GET', '/admin/brands', second_token)
    check('Disable additional super admin', 200, 'PATCH', f"/admin/accounts/{second['id']}/status", root, {'status': 'DISABLED'})
    check('Disabled super admin token rejected immediately', 403, 'GET', '/admin/brands', second_token)
    category = check('Create demo category', 201, 'POST', '/admin/categories', root,
                     {'name': 'A0.2 Demo Collection', 'slug': f'a02-collection-{suffix}'})
    demos = []
    for index, name in enumerate(['Cedar Studio', 'Indigo Loom', 'Saffron Works'], 1):
        brand = check(f'Create brand {index}', 201, 'POST', '/admin/brands', root,
                      {'name': name, 'slug': f'a02-{index}-{suffix}', 'description': 'A0.2 local demonstration'})
        account = {'email': f'a02-brand-{index}-{suffix}@brandista.local', 'password': secrets.token_urlsafe(24)}
        admin = check(f'Create assigned brand admin {index}', 201, 'POST', '/admin/accounts', root,
                      {**account, 'role': 'BRAND_ADMIN', 'brandIds': [brand['id']]})
        token = login(account)
        visible = check(f'Brand admin {index} reads assignments', 200, 'GET', '/admin/brands', token)
        assert [b['id'] for b in visible] == [brand['id']]
        check(f'Brand admin {index} cannot create platform admin', 403, 'POST', '/admin/accounts', token,
              {**secondary, 'role': 'SUPER_ADMIN', 'brandIds': []})
        check(f'Brand admin {index} cannot create brands', 403, 'POST', '/admin/brands', token,
              {'name': 'Forbidden', 'slug': f'forbidden-{suffix}'})
        product_data = {'name': f'{name} Demo Product', 'slug': f'a02-product-{index}-{suffix}',
                        'description': 'Published through the existing product API.', 'brandId': brand['id'],
                        'categoryId': category['id'], 'price': index * 1000, 'availability': 'AVAILABLE'}
        product = check(f'Brand admin {index} creates product', 201, 'POST', '/admin/products', token, product_data)
        check(f'Draft {index} hidden from customers', 404, 'GET', '/products/' + product['slug'])
        check(f'Brand admin {index} edits product', 200, 'PUT', f"/admin/products/{product['id']}", token, product_data)
        check(f'Brand admin {index} configures stock', 200, 'PUT', f"/admin/products/{product['id']}/stock", token, {'stockQuantity': 10})
        check(f'Brand admin {index} publishes product', 200, 'PATCH', f"/admin/products/{product['id']}/publish", token)
        check(f'Published product {index} publicly discoverable', 200, 'GET', '/products/' + product['slug'])
        catalogue = check(f'Brand admin {index} catalogue scoped', 200, 'GET', '/admin/products', token)
        assert all(p['brandId'] == brand['id'] for p in catalogue['content'])
        demos.append({'brand': brand, 'account': {**account, 'id': admin['id']}, 'token': token,
                      'product': product, 'data': product_data})
    credentials['demoAdministrators'] = [d['account'] for d in demos]
    credentials['demoBrands'] = [{'id': d['brand']['id'], 'name': d['brand']['name'], 'slug': d['brand']['slug'],
                                 'productSlug': d['product']['slug']} for d in demos]
    credential_path.write_text(json.dumps(credentials, indent=2))
    own, foreign = demos[0], demos[1]
    check('Cross-brand record read rejected', 403, 'GET', f"/admin/brands/{foreign['brand']['id']}", own['token'])
    check('Cross-brand product read rejected', 403, 'GET', f"/admin/products/{foreign['product']['id']}", own['token'])
    check('Cross-brand product creation rejected', 403, 'POST', '/admin/products', own['token'],
          {**foreign['data'], 'slug': f'cross-{suffix}'})
    check('Cross-brand product update rejected', 403, 'PUT', f"/admin/products/{foreign['product']['id']}", own['token'], foreign['data'])
    check('Cross-brand stock update rejected', 403, 'PUT', f"/admin/products/{foreign['product']['id']}/stock", own['token'], {'stockQuantity': 100})
    check('Product reassignment outside owned brands rejected', 403, 'PUT', f"/admin/products/{own['product']['id']}", own['token'],
          {**own['data'], 'brandId': foreign['brand']['id']})
    for action in ['publish', 'unpublish', 'deactivate']:
        check('Cross-brand ' + action + ' rejected', 403, 'PATCH', f"/admin/products/{foreign['product']['id']}/{action}", own['token'])
    check('Assignment changed by super admin', 200, 'PUT', f"/admin/accounts/{own['account']['id']}/brands", root,
          {'brandIds': [foreign['brand']['id']]})
    check('Old brand access revoked on existing token', 403, 'GET', f"/admin/products/{own['product']['id']}", own['token'])
    check('Restore demo assignment', 200, 'PUT', f"/admin/accounts/{own['account']['id']}/brands", root, {'brandIds': [own['brand']['id']]})
    check('Disable brand admin', 200, 'PATCH', f"/admin/accounts/{own['account']['id']}/status", root, {'status': 'DISABLED'})
    check('Disabled brand admin token rejected', 403, 'GET', '/admin/products', own['token'])
    check('Disabled brand admin login rejected', 401, 'POST', '/auth/login', payload={k: own['account'][k] for k in ['email', 'password']})
    check('Restore demo brand admin', 200, 'PATCH', f"/admin/accounts/{own['account']['id']}/status", root, {'status': 'ENABLED'})
    customer = {'email': f'a02-customer-{suffix}@brandista.local', 'password': secrets.token_urlsafe(24)}
    check('Public registration ignores requested elevated role', 201, 'POST', '/registrations', payload={**customer, 'role': 'SUPER_ADMIN'})
    customer_token = login(customer)
    check('Customer cannot access admin catalogue', 403, 'GET', '/admin/products', customer_token)
    check('Customer persistent cart still accessible', 200, 'GET', '/customers/me/cart', customer_token)
    for demo in demos:
        check('Customer sees ' + demo['brand']['name'], 200, 'GET', '/products/' + demo['product']['slug'], customer_token)
        listing = check('Customer filtered discovery ' + demo['brand']['name'], 200, 'GET', f"/products?brandId={demo['brand']['id']}", customer_token)
        assert any(p['id'] == demo['product']['id'] for p in listing['content'])
    credentials['demoCustomer'] = customer
    credential_path.write_text(json.dumps(credentials, indent=2))
finally:
    output = Path(args.results_file)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({'timestampUtc': datetime.now(timezone.utc).isoformat(), 'checks': results}, indent=2))
