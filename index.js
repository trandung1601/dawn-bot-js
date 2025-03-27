const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { connect } = require('puppeteer-real-browser')
const clickAndWaitPlugin = require('puppeteer-extra-plugin-click-and-wait')()
const { HttpsProxyAgent } = require('https-proxy-agent')
const { SocksProxyAgent } = require('socks-proxy-agent')
const { showBanner } = require('./banner')
const { config } = require('./config')

const Colors = {
  Gold: '\x1b[38;5;220m',
  Red: '\x1b[31m',
  Teal: '\x1b[38;5;51m',
  Green: '\x1b[32m',
  Neon: '\x1b[38;5;198m',
  Blue: '\x1b[34m',
  Magenta: '\x1b[95m',
  Dim: '\x1b[2m',
  RESET: '\x1b[0m'
}

async function performLogin(account) {
  let browser, page
  try {
    const connection = await connect({
      args: [],
      turnstile: true,
      headless: false,
      customConfig: {},
      connectOption: {
        defaultViewport: null
      },
      plugins: [clickAndWaitPlugin]
    })
    page = connection.page
    browser = connection.browser
  } catch (error) {
    console.error(
      `${Colors.Red}Error connecting to browser: ${error.message}${Colors.RESET}`
    )
    throw error
  }

  try {
    await page.goto('https://dashboard.dawninternet.com/signup', {
      waitUntil: 'domcontentloaded'
    })

    // Scroll to the bottom of the page
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })

    let appid

    // Listen for network responses
    page.on('response', async (response) => {
      const url = response.url()
      if (
        url ===
        'https://ext-api.dawninternet.com/chromeapi/dawn/v1/appid/getappid?app_v=1.1.9'
      ) {
        try {
          const data = await response.json()
          appid = data.data.appid
          console.log('App ID:', appid)
        } catch (error) {
          console.error('Error extracting API data:', error)
        }
      }
    })

    console.log(
      `${Colors.Neon}]> ${Colors.Gold}Waiting for Cloudflare Turnstile token...${Colors.RESET}`
    )

    const tokenHandle = await page.waitForFunction(
      () => {
        const input = document.querySelector(
          'input[name="cf-turnstile-response"]'
        )
        return input?.value ? input.value : false
      },
      { polling: 8000, timeout: config.MaxCF_Solve_Wait || 300000 }
    )
    const token = await tokenHandle.jsonValue()

    if (!token) {
      console.error(
        `${Colors.Neon}]> ${Colors.Red}Token not found for account: ${
          Colors.Teal
        }${maskEmail(account.email)}${Colors.RESET}`
      )
      throw new Error(
        `${Colors.Neon}]> ${Colors.Red}Failed to retrieve turnstile token${Colors.RESET}`
      )
    }

    const payload = {
      firstname: account.email,
      lastname: 'a',
      email: account.email,
      mobile: '',
      country: 'VN',
      password: account.password,
      referralCode: 'nz2bf2y6',
      token: token,
      isMarketing: true,
      browserName: 'chrome'
    }


    // You can uncomment and use the API requests here when you're ready to integrate
    // const validateRegister = await axios.post(
    //   `https://ext-api.dawninternet.com/chromeapi/dawn/v2/dashboard/user/validate-register?appid=${appid}`,
    //   payload,
    //   { headers: config.headers, timeout: 30000 }
    // );
    // const loginResponse = await axios.post('https://dashboard.dawninternet.com/signup', payload, { headers: config.headers, timeout: 30000 });

    console.log(
      `${Colors.Green}]> ${Colors.Teal}Create successful for ${maskEmail(
        account.email
      )}${Colors.RESET}`
    )
    // Perform further actions like saving the login token etc.
  } catch (error) {
    console.error(
      `An error occurred during login for ${maskEmail(account.email)}:`,
      error.message
    )
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

const maskEmail = (email) => {
  if (typeof email !== 'string') {
    throw new Error('Invalid input: email must be a string')
  }

  const [username, domain] = email.split('@')
  if (!username || !domain) {
    throw new Error('Invalid email format')
  }
  if (username.length < 4 || domain.length < 4) {
    return email
  }

  const maskedUsername = username.slice(0, 2) + ':::' + username.slice(-2)
  const maskedDomain = domain.slice(0, 2) + ':::' + domain.slice(-2)
  return `${maskedUsername}@${maskedDomain}`
}

async function loadAccounts(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        reject(err)
      }
      const accounts = data
        .split('\n')
        .map((line) => {
          const [email, password] = line.split(':')
          return { email, password }
        })
        .filter((account) => account.email && account.password)
      resolve(accounts)
    })
  })
}

async function main() {
  try {
    const accounts = await loadAccounts(path.join(__dirname, 'accounts.txt'))

    for (const account of accounts) {
      console.log(
        `${Colors.Blue}]> ${Colors.Green}Creating in account: ${maskEmail(
          account.email
        )}${Colors.RESET}`
      )
      await performLogin(account)
    }
  } catch (error) {
    console.error(
      `${Colors.Gold}An unexpected error occurred in main(). ${Colors.Red}${error.message}${Colors.RESET}`
    )
    process.exit(1)
  }
}

console.clear()
showBanner()
main()
