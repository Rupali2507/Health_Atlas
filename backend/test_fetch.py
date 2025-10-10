# test_fetch.py
from provider_requests import get_all_providers

providers = get_all_providers()
print(f"Fetched {len(providers)} providers")
if providers:
    print("First provider:", providers[0])
