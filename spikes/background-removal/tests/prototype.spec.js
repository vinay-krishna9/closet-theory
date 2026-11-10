import { test, expect } from '@playwright/test';
import { writeFile, existsSync } from 'node:fs';
import { promisify } from 'node:util';
async function photo(page) {
  const bytes = await page.evaluate(() => { const c = document.createElement('canvas'); c.width=320;c.height=400;const x=c.getContext('2d');x.fillStyle='#d0c8bb';x.fillRect(0,0,320,400);x.fillStyle='#17344e';x.beginPath();x.moveTo(100,70);x.lineTo(65,90);x.lineTo(35,150);x.lineTo(75,175);x.lineTo(95,140);x.lineTo(95,320);x.lineTo(225,320);x.lineTo(225,140);x.lineTo(245,175);x.lineTo(285,150);x.lineTo(255,90);x.lineTo(220,70);x.closePath();x.fill();return [...Uint8Array.from(atob(c.toDataURL().split(',')[1]),c=>c.charCodeAt(0))]; });
  return { name:'synthetic-shirt.png', mimeType:'image/png', buffer:Buffer.from(bytes) };
}
test('real model produces transparent output; warm retry and responsive layouts', async ({page}, testInfo) => {
  await page.goto('/');
  await page.locator('#photo').setInputFiles(await photo(page));
  await expect(page.locator('#status')).toContainText('Cutout ready', { timeout: 45000 });
  const first = JSON.parse(await page.locator('#metrics').innerText());
  expect(first.warmSession).toBe(false);
  expect(await page.locator('#result').evaluate(async img => { await img.decode(); const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.drawImage(img,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let low=0,high=0;for(let i=3;i<d.length;i+=4){if(d[i]<30)low++;if(d[i]>220)high++;}return low>100&&high>100; })).toBe(true);
  await page.getByRole('button',{name:'Retry',exact:true}).click();
  await expect(page.locator('#status')).toContainText('Cutout ready');
  const warm = JSON.parse(await page.locator('#metrics').innerText());expect(warm.warmSession).toBe(true);
  await promisify(writeFile)(testInfo.outputPath('measurements.json'),JSON.stringify({first,warm},null,2));
  await testInfo.attach('measurements.json',{body:JSON.stringify({first,warm},null,2),contentType:'application/json'});
  for(const width of [390,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:testInfo.outputPath(`layout-${width}.png`),fullPage:true});}
});
test('licensed real garment preview for visual quality review',async({page},testInfo)=>{
  test.skip(!existsSync('fixtures/t-shirt.jpg'),'Download the documented CC0 sample first');
  await page.goto('/');await page.locator('#photo').setInputFiles('fixtures/t-shirt.jpg');await expect(page.locator('#status')).toContainText('Cutout ready',{timeout:45000});
  await promisify(writeFile)(testInfo.outputPath('measurements.json'),await page.locator('#metrics').innerText());
  await page.screenshot({path:testInfo.outputPath('garment-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:testInfo.outputPath('garment-mobile.png'),fullPage:true});
});
test('cancel, stale worker messages, replacement, timeout and original preserve tags', async ({page}) => {
  await page.addInitScript(() => { window.Worker = class { constructor(){this.onmessage=null;} postMessage(){this.handle=setTimeout(()=>this.onmessage?.({data:{error:'STALE RESULT'}}),2000);} terminate(){/* Deliberately deliver a late message to test invalidation. */} }; });
  await page.goto('/');await page.locator('#tags').fill('navy casual autumn');const image=await photo(page);
  await page.locator('#photo').setInputFiles(image);await expect(page.locator('#status')).toContainText('Removing');
  await page.getByRole('button',{name:'Cancel processing'}).click();await page.waitForTimeout(2200);await expect(page.locator('#status')).toContainText('cancelled');
  await page.getByRole('button',{name:'Use original',exact:true}).click();await expect(page.locator('#result-label')).toContainText('Original selected');
  await page.clock.install();await page.getByRole('button',{name:'Retry',exact:true}).click();
  await page.locator('#photo').setInputFiles({name:'bad.png',mimeType:'image/png',buffer:Buffer.from('not an image')});await expect(page.locator('#status')).toContainText('Unsupported');
  await page.clock.runFor(2100);await expect(page.locator('#status')).toContainText('Unsupported');
  await page.evaluate(()=>{window.Worker=class{postMessage(){}terminate(){}};});
  await page.locator('#photo').setInputFiles(image);await expect(page.locator('#status')).toContainText('Removing');await page.clock.runFor(30001);await expect(page.locator('#status')).toContainText('timed out');
  await page.getByRole('button',{name:'Use original',exact:true}).click();await expect(page.locator('#tags')).toHaveValue('navy casual autumn');await expect(page.locator('#result-label')).toContainText('background retained');
});
test('missing model offers original and retry; oversized and malformed images rejected',async({page})=>{
  await page.route('**/models/u2netp.onnx',r=>r.fulfill({status:404,body:'missing'}));await page.goto('/');
  await page.locator('#photo').setInputFiles(await photo(page));await expect(page.locator('#status')).toContainText('Processing failed');await expect(page.getByRole('button',{name:'Use original',exact:true})).toBeEnabled();
  await page.locator('#photo').setInputFiles({name:'large.jpg',mimeType:'image/jpeg',buffer:Buffer.alloc(10*1024*1024+1)});await expect(page.locator('#status')).toContainText('exceeds 10 MB');
  await page.locator('#photo').setInputFiles({name:'broken.jpg',mimeType:'image/jpeg',buffer:Buffer.from([255,216,255,0])});await expect(page.locator('#status')).not.toContainText('Validating');await expect(page.locator('#result')).toBeHidden();
});
