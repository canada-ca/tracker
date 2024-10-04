const { test, expect } = require('@playwright/test');
require('dotenv').config();

// const dotenv = require('dotenv');
// const result = dotenv.config();

// if (result.error) {
//   throw result.error;
// }




const email = process.env.email  || '';
const password = process.env.password  || '';

// console.log('Email:', email);
// console.log('Password:', password);
// console.log('Email from env:', process.env.email);
// console.log('Password from env:', process.env.password);

// import { test, expect } from '@playwright/test';

test('Login page test', async ({ page }) => {
  // Navigate to the login page
  await page.goto('https://tracker.alpha.canada.ca/sign-in');

  // Fill in the username field
  await page.fill('#email', email);

  // Fill in the password field
  await page.fill('#password', password);

  // Click the login button
  await page.click('button[type="submit"]');

  // Optional: Wait for navigation after login, or check for a success message
  // await page.waitForURL('https://tracker.alpha.canada.ca');
  await page.waitForURL(/.*tracker\.alpha\.canada\.ca\/authenticate\/email\/.*/)
  // await page.waitForURL('https://tracker.alpha.canada.ca/sign-in');

  // Expect the URL to change to the dashboard or some other indication of a successful login
  expect(page.url()).toContain('https://tracker.alpha.canada.ca/authenticate/email');
  // expect(page.url()).toContain('https://tracker.alpha.canada.ca/sign-in');

});
