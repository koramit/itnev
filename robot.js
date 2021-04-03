const {Builder, By} = require('selenium-webdriver');
const axios = require('axios');
axios.defaults.headers.post['foobar'] = process.argv[7] ?? '';

const interationsNo =  process.argv[2] ?? 1;
const username =  process.argv[3] ?? '';
const password =  process.argv[4] ?? '';
const baseTarget =  process.argv[5] ?? '';
const baseEndpoint =  process.argv[6] ?? '';

(async function example() {
    let browser = await new Builder().forBrowser('chrome').build();
    try {
        // setup
        await browser.get(baseTarget);
        await browser.findElement(By.id('dn-box')).clear();
        await browser.findElement(By.id('dn-box')).sendKeys(1);
        await browser.findElement(By.xpath('/html/body/app-root/mat-sidenav-container/mat-sidenav-content/div/div[2]/app-device-setup/div/div[2]/button')).click();

        // login
        await browser.get(baseTarget + '/login');
        await browser.findElement(By.id('mat-input-0')).clear();
        await browser.findElement(By.id('mat-input-0')).sendKeys(username);
        await browser.findElement(By.id('mat-input-1')).sendKeys(password);
        await browser.findElement(By.xpath('/html/body/app-root/mat-sidenav-container/mat-sidenav-content/div/div[2]/app-login/div/div[2]/button')).click();
        console.log('wait for login');
        await browser.sleep(3000); // wait for redirect

        for (i = 1; i <= interationsNo; i++) {
            console.log('iteration#' + i + ' - ' + Date());
            await task(browser, baseEndpoint);
        }
    } catch (error) {
        console.log(error);
        await browser.quit();
    } finally {
        await browser.quit();
    }
})();

async function task(browser) {
    await browser.get(baseTarget + '/er-queue');
    console.log('wait for load er page for 10 secs');
    await browser.sleep(10000); // wait for load page again for dom accessing

    let promises = await browser.findElements({ css: '.item-container' })
                    .then(rows => rows.map(row => row));

    let patients = [];
    for(let i = 0; i < promises.length; i++) {
        patients.push({});

        // promises[i].findElement({ css: 'div.badge.med > p' })
        //     .then(node => node.getText().then(text => patients[i].medicine = text.trim() == 'M'))
        //     .catch(error => patients[i].medicine = false);

        // promises[i].findElement({ css: 'span.position-number' }).then(node => node.getText().then(text => {
        //     patients[i].bed = text.replaceAll("\n", '').trim();
        // })).catch(error => error);

        promises[i].findElement({ css: 'span.name' })
            .then(node => node.getText().then(text => patients[i].name = text.replaceAll("\n", '').trim()));

        // promises[i].findElement({ css: 'span.en' })
        //     .then(node => node.getText().then(text => patients[i].hn = text.replaceAll("\n", '').trim().replace('HN', '')));

        // promises[i].findElement({ css: 'p.value' })
        //     .then(node => node.getText().then(text => {
        //         patients[i].dx = text.replaceAll("\n", '').trim();
        //         if (patients[i].dx == '-') {
        //             patients[i].dx = null;
        //         }
        // }));

        // promises[i].findElement({ css: 'div.zone > p' })
        //     .then(node => node.getText().then(text => {
        //         patients[i].counter = text.replaceAll("\n", '').trim();
        //         if (! patients[i].medicine && patients[i].counter == 'C4') {
        //             patients[i].medicine = true;
        //         }
        // }));

        // promises[i].findElement({ css: 'p.time' })
        //     .then(node => node.getText().then(text => patients[i].los = text.replaceAll("\n", '').trim()));

        // promises[i].findElement({ css: 'div.round-rect > p' })
        //     .then(node => node.getText().then(text => patients[i].remark = text.replaceAll("\n", '').trim()));
    }
    console.log('wait for prepare patients for 10 secs');
    await browser.sleep(10000); // wait for operation

    console.log(patients);
    console.log('post venti success.');

    // *** history *** //
    await browser.get(baseTarget + '/history');
    console.log('wait for load history page for 10 secs');
    await browser.sleep(10000); // wait for load page

    promises = await browser.findElements({ css: 'mat-row' })
                    .then(rows => rows.map(row => row));

    let cases = [];
    // for(let i = 0; i < promises.length; i++) {
    //     cases.push({});

    //     promises[i].findElement({ css: 'mat-cell.mat-column-hn' }).getText().then(text => {
    //         cases[i].hn = text.replaceAll("\n", '').trim();
    //     });
    //     promises[i].findElement({ css: 'mat-cell.mat-column-movementType' }).getText().then(text => {
    //         cases[i].movement = text.replaceAll("\n", '').trim();
    //     });
    //     promises[i].findElement({ css: 'mat-cell.mat-column-cc' }).getText().then(text => {
    //         cases[i].cc = text.replaceAll("\n", '').trim();
    //     });
    //     promises[i].findElement({ css: 'mat-cell.mat-column-diag' }).getText().then(text => {
    //         cases[i].dx = text.replaceAll("\n", '').trim();
    //     });
    //     promises[i].findElement({ css: 'mat-cell.mat-column-scheme' }).getText().then(text => {
    //         cases[i].insurance = text.replaceAll("\n", '').trim();
    //     });
    //     promises[i].findElement({ css: 'mat-cell.mat-column-Check-in' }).getText().then(text => {
    //         cases[i].in_date = text.replaceAll("\n", '').trim();
    //     });
    //     promises[i].findElement({ css: 'mat-cell.mat-column-Check-in-time' }).getText().then(text => {
    //         cases[i].in_time = text.replaceAll("\n", '').trim();
    //     });
    //     promises[i].findElement({ css: 'mat-cell.mat-column-Check-out' }).getText().then(text => {
    //         cases[i].out_date = text.replaceAll("\n", '').trim();
    //     });
    //     promises[i].findElement({ css: 'mat-cell.mat-column-Check-out-time' }).getText().then(text => {
    //         cases[i].out_time = text.replaceAll("\n", '').trim();
    //     });

    //     promises[i].findElement({ css: 'mat-cell.mat-column-dispose' }).getText().then(text => {
    //         cases[i].outcome = text.replaceAll("\n", '').trim();
    //     });
    // }

    console.log('wait for prepare cases for 10 secs');
    await browser.sleep(10000);

    for(let i = 0; i < cases.length; i++) {
        cases[i].encountered_at = cases[i].in_date + ' ' + cases[i].in_time;
        cases[i].dismissed_at = cases[i].out_date + ' ' + cases[i].out_time;
        delete cases[i].in_date;
        delete cases[i].in_time;
        delete cases[i].out_time;
        delete cases[i].out_date;
    }

    console.log(cases);
    console.log('post history success.');

    console.log('finishing iteration for 9 secs');
    await browser.sleep(9000);

    const pages = ['/triage-queue', '/doctor-queue', '/rn-tasks', '/pn-tasks', '/consult-tasks', '/check-out-tasks', '/dashboard'];

    let page = pages[Math.floor(Math.random() * pages.length)];
    await browser.get('http://172.29.10.164' + page);
    console.log(`visit ${page} for 25 secs`);
    await browser.sleep(25000);

    page = pages[Math.floor(Math.random() * pages.length)];
    await browser.get('http://172.29.10.164' + page);
    console.log(`visit ${page} for 25 secs`);
    await browser.sleep(25000);
}