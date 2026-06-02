import os
import requests
from dotenv import load_dotenv

load_dotenv()
CRAWL_URL = os.getenv('CRAWL_URL', 'https://example.com')

if __name__ == '__main__':
    print(f'Crawling: {CRAWL_URL}')
    response = requests.get(CRAWL_URL, timeout=15)
    response.raise_for_status()
    print('Status code:', response.status_code)
    print('Body snippet:')
    print(response.text[:500])
