const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 1500 });

  console.log('🚀 Navigating to login page...');
  await page.goto('https://vanirlive.omnna-lbm.live/index.php?action=Login&module=Users', {
    waitUntil: 'networkidle2'
  });

  await page.waitForSelector('#user_name');
  console.log('⌨️ Typing username...');
  await page.type('#user_name', 'richard.mcgirt', { delay: 100 });

  console.log('⌨️ Typing password...');
  await page.type('#user_password', '84625', { delay: 100 });

  console.log('🖱️ Clicking login button...');
  await page.click('input[type="submit"][name="Login"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  console.log('📄 Navigating to Reports List View...');
  await page.goto('https://vanirlive.omnna-lbm.live/index.php?module=Customreport&action=CustomreportAjax&file=Customreportview&parenttab=Analytics&entityId=6309274', { waitUntil: 'networkidle2' });

  console.log('📌 Waiting for template dropdown...');
  await page.waitForSelector('#ddlSavedTemplate');

  console.log('📝 Selecting "daily report" template...');
  await page.select('#ddlSavedTemplate', '328');

  console.log('⏳ Waiting briefly for form to update...');
  await new Promise(resolve => setTimeout(resolve, 1000)); // compatible across versions
  

  console.log('⚙️ Clicking "Generate Now"...');
  await page.click('input[type="submit"][name="generatenw"]');

  console.log('⏳ Waiting for "Export To CSV" to be enabled and visible...');
  await page.waitForFunction(() => {
    const btn = document.getElementById('btnExport');
    return btn && !btn.disabled && btn.offsetParent !== null;
  }, { timeout: 15000 });
  
  console.log('⏳ Giving extra time for page to finish loading...');
  await new Promise(resolve => setTimeout(resolve, 2000)); // add delay buffer

// Wait for some report/table element to appear (adjust selector based on the actual content)
await page.waitForSelector('#reportDiv, .reportTable, table, .mainContent', { timeout: 15000 });

console.log('⏳ Waiting 2 seconds after report content is visible...');
await new Promise(resolve => setTimeout(resolve, 2000));

// Ensure download behavior is enabled
const downloadPath = path.join(os.homedir(), 'Desktop', 'Briqdata');
const targetFileName = 'OpenPOReportbyVendorSalesmanDateCreated-1742910735-44512876.csv';
const fullTargetPath = path.join(downloadPath, targetFileName);

fs.mkdirSync(downloadPath, { recursive: true });
if (fs.existsSync(fullTargetPath)) fs.unlinkSync(fullTargetPath);

await page._client().send('Page.setDownloadBehavior', {
  behavior: 'allow',
  downloadPath
});

console.log('📥 Clicking "Export To CSV"...');
await page.click('#btnExport');

  
  await page.click('#btnExport');
  console.log('📥 Export triggered, waiting for file to download...');
  
  // Wait and watch for the file to appear (Puppeteer doesn't provide native download hooks)
  const waitForDownload = async (timeout = 15000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const files = fs.readdirSync(downloadPath);
      const csvFile = files.find(f => f.endsWith('.csv') && f !== targetFileName);
      if (csvFile) {
        const currentPath = path.join(downloadPath, csvFile);
        fs.renameSync(currentPath, fullTargetPath); // rename to desired name
        console.log(`✅ File downloaded and renamed to ${targetFileName}`);
        return;
      }
      await new Promise(r => setTimeout(r, 500));
    }
    console.warn('⚠️ CSV download not detected within timeout.');
  };
  
  await waitForDownload();
  
  console.log('✅ Export triggered.');
  await new Promise(resolve => setTimeout(resolve, 1000)); // compatible across versions

  await browser.close();
})();
