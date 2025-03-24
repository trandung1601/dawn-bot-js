const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { connect } = require('puppeteer-real-browser')
const clickAndWaitPlugin = require('puppeteer-extra-plugin-click-and-wait')()
const { HttpsProxyAgent } = require('https-proxy-agent')
const { SocksProxyAgent } = require('socks-proxy-agent')

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
  console.debug('performLogin() ')
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
      // Scroll to the bottom by setting the scroll position to the maximum height
      window.scrollTo(0, document.body.scrollHeight)
    })

    let appid

    // Listen for network responses
    page.on('response', async (response) => {
      const url = response.url()

      // Check if the response is for the specific API call
      if (
        url ===
        'https://ext-api.dawninternet.com/chromeapi/dawn/v1/appid/getappid?app_v=1.1.9'
      ) {
        try {
          // Get the JSON response data
          const data = await response.json()

          // Log or process the API response data
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
    // Set up an Axios interceptor to log the request
    axios.interceptors.request.use((request) => {
      console.log('Request sent:', request)
      return request
    })

    // Set up an Axios interceptor to log the response
    axios.interceptors.response.use((response) => {
      console.log('Response received:', response)
      return response
    })
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

    console.debug('TOKEN VALUE: ', token)

    if (!token) {
      console.error(
        `${Colors.Neon}]> ${
          Colors.Red
        }Token not found on the page for account: ${Colors.Teal}${maskEmail(
          account.email
        )}${Colors.RESET}`
      )
      throw new Error(
        `${Colors.Neon}]> ${Colors.Red}Failed to retrieve turnstile token${Colors.RESET}`
      )
    }

    // Request payload
    const payload = {
      firstname: 'luc.ky.t.td1.6@gmail.com',
      lastname: 'a',
      email: 'luc.ky.t.td1.6@gmail.com',
      mobile: '',
      country: 'VN',
      password: 'Sunflower160195!',
      referralCode: 'nz2bf2y6',
      token: token,
      isMarketing: true,
      browserName: 'chrome'
    }

    console.debug('PAYLOAD: ', payload)

    // const validateRegister = await axios.post(
    //   `https://ext-api.dawninternet.com/chromeapi/dawn/v2/dashboard/user/validate-register?appid=${appid}`,
    //   payload,
    //   {
    //     headers: config.headers,
    //     timeout: 30000
    //   }
    // )

    // await sleep(5 * 60 * 1000)

    // console.log('Registration Validation Response:', validateRegister.data)

    // const loginResponse = await axios.post(
    //   'https://dashboard.dawninternet.com/signup',
    //   payload,
    //   {
    //     headers: {
    //       'x-api-key': config.ApiKey,
    //       'Content-Type': 'application/json',
    //       'user-agent': config.Useragent
    //     },
    //     timeout: 30000
    //   }
    // )

    // const access_token = loginResponse.data && loginResponse.data.access_token
    // if (access_token) {
    //   console.log(
    //     `${Colors.Neon}]> ${Colors.Green}Login successful for ${
    //       Colors.Teal
    //     }${maskEmail(account.email)}${Colors.RESET}`
    //   )
    //   console.log(
    //     `${Colors.Neon}]> ${Colors.RESET}cf-turnstile-response token: ${Colors.Dim}${Colors.Teal}${token}${Colors.RESET}`
    //   )
    //   console.log(
    //     `${Colors.Neon}]> ${Colors.RESET}token-Login-response: ${Colors.Dim}${Colors.Blue}${access_token}${Colors.RESET}`
    //   )
    //   await saveAccountData({ email: account.email, access_token })
    // } else {
    //   console.error(
    //     `${Colors.Neon}]> ${Colors.Red}Login failed for ${
    //       Colors.Teal
    //     }${maskEmail(account.email)}${
    //       Colors.Red
    //     } due to missing access token in response.${Colors.RESET}`
    //   )
    //   throw new Error(
    //     `${Colors.Neon}]> ${Colors.Red}Missing access_token in response ${Colors.RESET}`
    //   )
    // }

    // return { email: account.email, access_token }
  } catch (error) {
    console.error(
      `An error occurred during login for ${maskEmail(account.email)}:`,
      error.message
    )
    await sleep(5 * 60 * 1000)
    throw error
  } finally {
    if (browser) {
      // await browser.close()
    }
  }
}

function CoderMark() {
  console.log(`
  ╭━━━╮╱╱╱╱╱╱╱╱╱╱╱╱╱╭━━━┳╮
  ┃╭━━╯╱╱╱╱╱╱╱╱╱╱╱╱╱┃╭━━┫┃${Colors.Green}
  ┃╰━━┳╮╭┳━┳━━┳━━┳━╮┃╰━━┫┃╭╮╱╭┳━╮╭━╮
  ┃╭━━┫┃┃┃╭┫╭╮┃╭╮┃╭╮┫╭━━┫┃┃┃╱┃┃╭╮┫╭╮╮${Colors.Blue}
  ┃┃╱╱┃╰╯┃┃┃╰╯┃╰╯┃┃┃┃┃╱╱┃╰┫╰━╯┃┃┃┃┃┃┃
  ╰╯╱╱╰━━┻╯╰━╯┣━━┻╯╰┻╯╱╱╰━┻━╮╭┻╯╰┻╯╰╯${Colors.RESET}
  ╱╱╱╱╱╱╱╱╱╱╱┃┃╱╱╱╱╱╱╱╱╱╱╭━╯┃${Colors.Blue}{${Colors.Neon}cmalf${Colors.Blue}}${
    Colors.RESET
  }
  ╱╱╱╱╱╱╱╱╱╱╱╰╯╱╱╱╱╱╱╱╱╱╱╰━━╯
  \n${Colors.RESET}Teneo Auto Login Bot ${Colors.Blue}{ ${Colors.Neon}JS${
    Colors.Blue
  } }${Colors.RESET}
      \n${Colors.Green}${'―'.repeat(50)}
      \n${Colors.Gold}[+]${Colors.RESET} DM : ${
    Colors.Teal
  }https://t.me/furqonflynn
      \n${Colors.Gold}[+]${Colors.RESET} GH : ${
    Colors.Teal
  }https://github.com/cmalf/
      \n${Colors.Green}${'―'.repeat(50)}
      \n${Colors.Gold}]-> ${Colors.Blue}{ ${Colors.RESET}TENEO Extension${
    Colors.Neon
  } v2.0.0${Colors.Blue} } ${Colors.RESET}
      \n${Colors.Gold}]-> ${Colors.Blue}{ ${Colors.RESET}Turnstile CF Bypass${
    Colors.Neon
  } Free${Colors.Blue} } ${Colors.RESET}
      \n${Colors.Gold}]-> ${Colors.Blue}{ ${Colors.RESET}BOT${
    Colors.Neon
  } v1.0.0${Colors.Blue} } ${Colors.RESET}
      \n${Colors.Green}${'―'.repeat(50)}
      `)
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

async function main() {
  await performLogin({
    email: 'trantiendung1601@gmail.com',
    password: 'Tiendung160195!'
  })
}

console.clear()
CoderMark()
main().catch((error) => {
  console.error(
    `${Colors.Gold}An unexpected error occurred in main(). ${Colors.Red}${error.message}${Colors.RESET}`
  )
  process.exit(1)
})

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
