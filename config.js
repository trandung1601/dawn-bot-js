const config = {
  Useragent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', // Change with your UserAgent on default browser
  ApiKey: 'OwAG3kib1ivOJG4Y0OCZ8lJETa6ypvsDtGmdhcjB', // don't change it
  PROXY_FILE: 'proxies.txt', // path to your proxy file
  Timers: 5, // delayed between accounts prossesing (default is 5 seconds)
  MaxCF_Solve_Wait: 120000, // delayed for solving Turntile Cloudflare (default is 1 minutes 'depen on your proxy qualities')
  headers: {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
    'content-type': 'application/json',
    'dnt': '1',
    'origin': 'https://dashboard.dawninternet.com',
    'priority': 'u=1, i',
    'referer': 'https://dashboard.dawninternet.com',
    'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Microsoft Edge";v="134"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0',
  },
}

module.exports = { config }
