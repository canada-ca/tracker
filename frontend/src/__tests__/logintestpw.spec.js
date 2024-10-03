const { test, expect } = require('@playwright/test');

test('Login page test', async ({ page }) => {
  // Navigate to the login page
  await page.goto('https://tracker.alpha.canada.ca/sign-in');

  // Fill in the username field
  await page.fill('#email', 'zakaria.hiri@tbs-sct.gc.ca');

  // Fill in the password field
  await page.fill('#password', 'MCIGTBATITF.7');

  // Click the login button
  await page.click('button[type="submit"]');

  // Optional: Wait for navigation after login, or check for a success message
  // await page.waitForURL('https://tracker.alpha.canada.ca');
  await page.waitForURL(/.*tracker\.alpha\.canada\.ca\/authenticate\/email\/.*/)
  // Expect the URL to change to the dashboard or some other indication of a successful login
  expect(page.url()).toContain('https://tracker.alpha.canada.ca/authenticate/email');
  
});
