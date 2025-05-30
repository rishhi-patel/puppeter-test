import { NextRequest, NextResponse } from "next/server"
import puppeteerCore from "puppeteer-core"
import puppeteer from "puppeteer"
import chromium from "@sparticuz/chromium-min"

const remoteExecutablePath =
  "https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar"

export async function POST(req: NextRequest) {
  try {
    const { encoded } = await req.json()

    if (!encoded) {
      return NextResponse.json(
        { message: "Missing encoded data" },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const pdfPageUrl = `${baseUrl}/pdf-render?data=${encoded}`

    const isProd = process.env.NEXT_PUBLIC_VERCEL_ENVIRONMENT === "production"

    const browser = await (isProd
      ? puppeteerCore.launch({
          args: chromium.args,
          executablePath: await chromium.executablePath(remoteExecutablePath),
          headless: chromium.headless,
        })
      : puppeteer.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
          headless: true,
        }))

    const page = await browser.newPage()
    await page.goto(pdfPageUrl, { waitUntil: "domcontentloaded" })
    await page.waitForSelector("#final-report", { timeout: 8000 }) // replace with your actual selector

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    })

    await browser.close()

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          "inline; filename=SurgiTwin_Performance_Report.pdf",
      },
    })
  } catch (error) {
    console.error("web-to-pdf API error:", error)
    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 }
    )
  }
}
