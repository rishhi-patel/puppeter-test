import chromium from "@sparticuz/chromium-min"
import puppeteerCore from "puppeteer-core"
import puppeteer from "puppeteer"

export const dynamic = "force-dynamic"

let browser

async function getBrowser() {
  if (browser) return browser

  const isProd = process.env.NEXT_PUBLIC_VERCEL_ENVIRONMENT === "production"

  if (isProd) {
    browser = await puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })
  } else {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    })
  }

  return browser
}

async function checkPageStatus(url) {
  let statusCode
  try {
    const browser = await getBrowser()
    const page = await browser.newPage()
    const response = await page.goto(url, { waitUntil: "domcontentloaded" })
    statusCode = response && response.status() === 200 ? 200 : 404
    await page.close()
  } catch (error) {
    console.error("Error accessing page:", error)
    statusCode = 404
  }
  return statusCode === 200
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")
  if (!url) {
    return new Response(
      JSON.stringify({ error: "URL parameter is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
  const status = await checkPageStatus(url)
  return new Response(
    JSON.stringify({
      statusCode: status ? 200 : 404,
      is200: status,
    }),
    {
      status: status ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    }
  )
}
