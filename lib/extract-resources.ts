import type { Browser } from "puppeteer";

export async function extractResources(url: string, browser: Browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  page.on('console', msg => console.log(msg.text()));
  await new Promise((r) => setTimeout(r, 500)); // wait ig?

  await page.waitForSelector('#accept-btn')
  await page.click('#accept-btn');

  const { firstPage, totalPages } = await page.evaluate(() => {
    const images = document.querySelectorAll("img");
    let firstPage = "";
    let firstPageAlt = "";

    images.forEach((image) => {
      if (image.src.includes("musescore.com/static/musescore/scoredata/g")) {
        firstPage = image.src;
        firstPageAlt = image.alt;
      }
    });

    const totalPages = Number(firstPageAlt.split(" ").at(-2));
    return { firstPage, totalPages };
  });

  console.log(totalPages)

  await page.mouse.move(500, 500);

  let otherPages: string[] = [];
  for (let i = 0; i < totalPages*2; i++) {
    await page.mouse.wheel({ deltaY: 1000});
    await new Promise((r) => setTimeout(r, 500));

    const newOtherPages = await page.evaluate(() => {
      const images = document.querySelectorAll("img");
      const matches: string[] = [];

      images.forEach((image) => {
        if (image.src.includes("s3.ultimate-guitar.com/musescore.scoredata/g/"))
          matches.push(image.src);
      });

      return matches;
    });

    otherPages.push(...newOtherPages);
  }
  otherPages = otherPages.filter((page, i) => otherPages.indexOf(page) === i);

  return [firstPage, ...otherPages];
}
