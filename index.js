const {Builder, By} = require('selenium-webdriver');
const axios = require('axios');
axios.defaults.headers.post['foobar'] = process.argv[7] ?? '';

const interationsNo =  process.argv[2] ?? 1;
const username =  process.argv[3] ?? '';
const password =  process.argv[4] ?? '';
const baseTarget =  process.argv[5] ?? '';
const baseEndpoint =  process.argv[6] ?? '';

const browser = new Builder().forBrowser('chrome').build();

async function scan() {
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
            await grabWhiteboard().then(fetchHn)
                                  .then(grabProfile)
                                  .then(pushProfile);
        }
    } catch (error) {
        console.log(error);
        await browser.quit();
    } finally {
        await browser.quit();
    }
};

async function grabWhiteboard() {
    await browser.get(baseTarget + '/er-queue');
    console.log('reading whiteboard...');
    await browser.sleep(10000); // wait for load page again for dom accessing

    let promises = await browser.findElements({ css: '.item-container' })
                    .then(rows => rows.map(row => row));

    let patients = [];
    for(let i = 0; i < promises.length; i++) {
        patients.push({});

        await promises[i].findElement({ css: 'div.badge.med > p' })
            .then(node => node.getText())
            .then(text => patients[i].medicine = text.trim() == 'M')
            .catch(() => patients[i].medicine = false);

        await promises[i].findElement({ css: 'span.name' })
            .then(node => node.getText())
            .then(text => patients[i].name = text.replaceAll("\n", '').trim())
            .catch(() => patients[i].name = null);

        await promises[i].findElement({ css: 'span.en' })
            .then(node => node.getText())
            .then(text => patients[i].hn = text.replaceAll("\n", '').trim().replace('HN', ''))
            .catch(() => patients[i].hn = null);

        await promises[i].findElement({ css: 'div.zone > p' })
            .then(node => node.getText())
            .then(text => {
                patients[i].counter = text.replaceAll("\n", '').trim();
                if (! patients[i].medicine && patients[i].counter == 'C4') {
                    patients[i].medicine = true;
                }
            })
            .catch(() => patients[i].counter = null);

        await promises[i].findElement({ css: 'p.time' })
            .then(node => node.getText())
            .then(text => patients[i].los = text.replaceAll("\n", '').trim())
            .catch(() => patients[i].los = null);

        await promises[i].findElement({ css: 'div.round-rect > p' })
            .then(node => node.getText())
            .then(text => patients[i].remark = text.replaceAll("\n", '').trim())
            .catch(() => patients[i].remark = null);
    }
    await browser.sleep(10000);
    console.log(patients);
    return axios.post(baseEndpoint + '/dudes/venti', { patients: patients })
        .then(res => console.log('upload whiteboard OK.'))
        .catch(error => console.log('upload whiteboard FAILED.'));
}

const fetchHn = async function () {
    return axios.post(baseEndpoint + '/dudes/venti/hn')
                .then(res => res.data)
                .catch(() => { hn: false });
}

const grabProfile = async function (stay) {
    let profile = { found: false };
    if (stay.hn === false) {
        return profile;
    }

    // WebElement cannot click out of screen, use script instead.
    await browser.executeScript(`
                let items = [...document.querySelector('div.item-list').querySelectorAll('div.item')];
                let nodes = items.filter(item => item.textContent.indexOf(${stay.hn}) != -1);
                if (nodes.length == 0) {
                    return false;
                }
                let node = nodes[0];
                node.click();
                return true;
            `).then(found => profile.found = found)
            .catch(error => console.log(error));

    if (! profile.found) {
        return profile;
    }

    await browser.sleep(10000);

    profile.found = false;
    await browser.executeScript(`
        if (document.readyState !== 'complete') {
            console.log('abort, document not ready');
            return false;
        }

        let events = [...document.querySelectorAll('div.event')];
        if (events.pop() === undefined ||
            ! document.querySelector('.bio-box > div:nth-child(2) > div:nth-child(2)') ||
            ! document.querySelector('.bio-box > div:nth-child(2) > div:nth-child(3)')
        ) {
            console.log('abort, document not ready');
            return false;
        }

        return true;
    `).then(ready => profile.found = ready)
    .catch(error => console.log(error));

    if (! profile.found) {
        return profile;
    }

    profile.no = stay.no;
    await browser.findElement({css: '.bio-box > div:nth-child(2) > div:nth-child(2)'})
                .then(node => node.getText())
                .then(text => profile.hn = text.replaceAll("\n", ' | ').replace('HN : ', '').replace(' Search HN', '').trim())
                .catch(() => profile.hn = null);
    await browser.findElement({css: '.bio-box > div:nth-child(2) > div:nth-child(3)'})
                .then(node => node.getText())
                .then(text => profile.en = text.replaceAll("\n", ' | ').replace('EN : ', '').trim())
                .catch(() => profile.en = null);
    await browser.findElements({css: 'div.timestamp'})
                .then(nodes => nodes.pop().getText())
                .then(text => profile.encountered_at = text)
                .catch(() => profile.encountered_at = null);
    await browser.findElement({css: '.scheme-box > div:nth-child(1)'})
                .then(node => node.getText())
                .then(text => profile.insurance = text.replaceAll("\n", ' | ').trim())
                .catch(() => profile.insurance = null);
    await browser.findElement({css: '.symptom-box > div:nth-child(1)'})
                .then(node => node.getText())
                .then(text => profile.cc = text.replaceAll("\n", ' | ').replace('CC : ', '').trim())
                .catch(() => profile.cc = null);
    await browser.findElement({css: '.symptom-box > div:nth-child(2)'})
                .then(node => node.getText())
                .then(text => profile.dx = text.replaceAll("\n", ' | ').replace('Dx :', '').trim())
                .catch(() => profile.dx = null);
    await browser.findElement({css: '.movement-type-box > div:nth-child(1)'})
                .then(node => node.getText())
                .then(text => profile.location = text.replaceAll("\n", ' | ').trim())
                .catch(() => profile.location = null);
    await browser.findElement({css: 'app-card-triage-detail'})
                .then(node => node.getText())
                .then(triage => profile.triage = triage.replaceAll("\n", ' | ').trim().trim('|'))
                .catch(() => profile.triage = null);
    await browser.findElement({css: '.vital-sign'})
                .then(node => node.getText())
                .then(text => profile.vital_signs = text.trim().replaceAll("\n", ' | ')
                                                    .replace(' Edit', '')
                                                    .replace('T', 'T: ')
                                                    .replace('PR', ' | PR: ')
                                                    .replace('RR', ' | RR: ')
                                                    .replace('BP', ' | BP: ')
                                                    .replace('O2', ' | O2: '))
                .catch(() => profile.location = null);
    return profile;
}

const pushProfile = function (profile) {
    if (! profile.found) {
        return;
    }
    console.log(profile);

    return axios.post(baseEndpoint + '/dudes/venti/profile', {"profile": profile })
            .then(() => console.log('upload profile OK.'))
            .catch(() => console.log('upload profile FAILED'));
}

scan();