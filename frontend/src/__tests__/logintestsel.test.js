// // Import required modules
// const { Builder, By, until } = require('selenium-webdriver');
// const chrome = require('selenium-webdriver/chrome');

// (async function loginTest() {
//     // Create a new instance of the Chrome driver
//     let driver = await new Builder().forBrowser('chrome').build();

//     try {
//         // Navigate to the login page
//         await driver.get('https://tracker.alpha.canada.ca/sign-in');

//         // Locate the username field and enter the username
//         await driver.findElement(By.name('email')).sendKeys('zakaria.hiri@tbs-sct.gc.ca');

//         // Locate the password field and enter the password
//         await driver.findElement(By.name('password')).sendKeys('MCIGTBATITF.7');

//         // Locate and click the login button
//         await driver.findElement(By.id('login-button')).click();

//         // Wait for the URL to change after login (you can modify the condition as needed)
//         await driver.wait(until.urlIs(/.*tracker\.alpha\.canada\.ca\/authenticate\/email\/.*/), 5000);

//         // Optionally, check for a specific element that should be visible after login
//         let dashboardElement = await driver.findElement(By.id('dashboard-element'));
//         console.log('Dashboard element is displayed:', await dashboardElement.isDisplayed());
//     } catch (error) {
//         console.error('Error during login test:', error);
//     } finally {
//         // Quit the driver after the test
//         await driver.quit();
//     }
// })();


// const { Builder, By, until } = require('selenium-webdriver');
// const chrome = require('selenium-webdriver/chrome');

// (async function loginTest() {
//     const options = new chrome.Options();
//     options.addArguments('--headless'); // Run in headless mode
//     options.addArguments('--no-sandbox'); // Bypass OS security model
//     options.addArguments('--disable-dev-shm-usage'); // Overcome limited resource problems
//     options.addArguments('--disable-gpu'); // Applicable only to Windows OS.

//     // Create a new instance of the Chrome driver with options
//     let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

//     try {
//         await driver.get('https://tracker.alpha.canada.ca/sign-in');
//         await driver.findElement(By.name('email')).sendKeys('zakaria.hiri@tbs-sct.gc.ca');
//         await driver.findElement(By.name('password')).sendKeys('MCIGTBATITF.7');
//         await driver.findElement(By.id('login-button')).click();
//         await driver.wait(until.urlIs(/.*tracker\.alpha\.canada\.ca\/authenticate\/email\/.*/), 5000);
//         let dashboardElement = await driver.findElement(By.id('dashboard-element'));
//         console.log('Dashboard element is displayed:', await dashboardElement.isDisplayed());
//     } catch (error) {
//         console.error('Error during login test:', error);
//     } finally {
//         await driver.quit();
//     }
// })();


// const { Builder, By, until } = require('selenium-webdriver');
// const chrome = require('selenium-webdriver/chrome');
// // const path = require('path');

// (async function loginTest() {
//     const options = new chrome.Options();
//     options.addArguments('--headless');
//     options.addArguments('--no-sandbox');
//     options.addArguments('--disable-dev-shm-usage');
//     options.addArguments('--disable-gpu');

//     const service = new chrome.ServiceBuilder(require.resolve('chromedriver')).build();
//     service.start(); // Start the service

//     // Create a new instance of the Chrome driver with the path to the chromedriver
//     let driver = await new Builder()
//         .forBrowser('chrome')
//         .setChromeOptions(options)
//         .usingServer(service.address()) // Specify the service address
//         .build();

//     try {
//         await driver.get('https://tracker.alpha.canada.ca/sign-in');
//         await driver.findElement(By.name('username')).sendKeys('zakaria.hiri@tbs-sct.gc.ca');
//         await driver.findElement(By.name('password')).sendKeys('MCIGTBATITF.7');
//         await driver.findElement(By.id('login-button')).click();
//         await driver.wait(until.urlIs(/.*tracker\.alpha\.canada\.ca\/authenticate\/email\/.*/), 5000);
//         let dashboardElement = await driver.findElement(By.id('dashboard-element'));
//         console.log('Dashboard element is displayed:', await dashboardElement.isDisplayed());
//     } catch (error) {
//         console.error('Error during login test:', error);
//     } finally {
//         await driver.quit();
//     }
// })();


// const { Builder, By, until } = require('selenium-webdriver');
// const edge = require('selenium-webdriver/edge');
// // const path = require('path');
// const path = require('path');
// const edgedriverPath = path.join(__dirname, '../../node_modules/edgedriver/bin/edgedriver');

// (async function loginTest() {
//     const options = new edge.Options();
//     options.addArguments('--enable-logging');
//     options.addArguments('--v=1'); // Set log level to info


//     // Setup ChromeDriver service
//     const service = new edge.ServiceBuilder(edgedriverPath)
//     .loggingTo('edgedriver.log')
//     .enableVerboseLogging()
//     .build();

//     service.start();

//     // Create a new instance of the Chrome driver
//     let driver = await new Builder()
//         .forBrowser('MicrosoftEdge')
//         .setEdgeOptions(options)
//         .usingServer(service.address())
//         .build();

//     try {
//         await driver.get('https://tracker.alpha.canada.ca/sign-in');
//         await driver.findElement(By.name('username')).sendKeys('zakaria.hiri@tbs-sct.gc.ca');
//         await driver.findElement(By.name('password')).sendKeys('MCIGTBATITF.7');
//         await driver.findElement(By.id('login-button')).click();
//         await driver.wait(until.urlIs('http://your-login-page-url.com/dashboard'), 5000);
//         let dashboardElement = await driver.findElement(By.id('dashboard-element'));
//         console.log('Dashboard element is displayed:', await dashboardElement.isDisplayed());
//     } catch (error) {
//         console.error('Error during login test:', error);
//     } finally {
//         await driver.quit();
//         service.stop();
//     }
// })();

const { Builder, By, until } = require('selenium-webdriver');
const edge = require('selenium-webdriver/edge');
// const path = require('path');

(async function loginTest() {
    const options = new edge.Options();
    options.addArguments('--enable-logging');
    options.addArguments('--v=1'); // Set log level to info

    // Adjust this path to where you placed the msedgedriver executable
    const service = new edge.ServiceBuilder('/workspaces/tracker/frontend/bin/msedgedriver')
    .loggingTo('edgedriver.log')
    .enableVerboseLogging()
    .build();

    service.start();

    // Create a new instance of the Edge driver
    let driver = await new Builder()
        .forBrowser('MicrosoftEdge')
        .setEdgeOptions(options)
        .usingServer(service.address())
        .build();

    try {
        await driver.get('https://tracker.alpha.canada.ca/sign-in');
        await driver.findElement(By.name('username')).sendKeys('zakaria.hiri@tbs-sct.gc.ca');
        await driver.findElement(By.name('password')).sendKeys('MCIGTBATITF.7');
        await driver.findElement(By.id('login-button')).click();
        await driver.wait(until.urlIs('http://your-login-page-url.com/dashboard'), 5000);
        let dashboardElement = await driver.findElement(By.id('dashboard-element'));
        console.log('Dashboard element is displayed:', await dashboardElement.isDisplayed());
    } catch (error) {
        console.error('Error during login test:', error);
    } finally {
        await driver.quit();
        service.stop();
    }
})();
