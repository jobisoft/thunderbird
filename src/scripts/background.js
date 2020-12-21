/* Initialize settings */
browser.storage.local.get("whois").then((item) => {if (Object.entries(item).length==0){browser.storage.local.set({"whois":"https://whois.com/whois/"})}})
browser.storage.local.get("server").then((item) => {if (Object.entries(item).length==0){browser.storage.local.set({"server":"https://api.justreport.it/lookup/"})}})
browser.storage.local.get("api-key").then((item) => {if (Object.entries(item).length==0){browser.storage.local.set({"api-key":"API-KEY"})}})

browser.messageDisplayAction.onClicked.addListener((tab) =>{
  browser.messageDisplay.getDisplayedMessage(tab.id).then((message) => {
    browser.messages.getRaw(message.id).then((raw) => {
      var spamDomain = extractDomain(message.author);
      getAbuseEmail(spamDomain).then((response) => {
        response().then((serverResponse) => {
          if (serverResponse.status == "success"){
            composeEmail(serverResponse.data.email, spamDomain, raw)
          }
          else {
            composeEmail("", spamDomain, raw).then(() => {
              createPopup(spamDomain).then((popup) => popup());
            });
          }
        })
      })
    });
  });
})

async function composeEmail(to, domain, raw){
  await browser.compose.beginNew({to: to,
    subject: "Spam Abuse from: " + domain,
    plainTextBody: getBody(domain, raw)
  });
}

function createPopup(domain){
  return browser.storage.local.get("whois").then((item) => async function(){
    var window = await messenger.windows.create({
      url: item.whois + domain,
      type: "popup"
    });
    await setFocused(window);
  });
}

async function setFocused(window){
  await messenger.windows.update(window.id, {
    focused: true
  });
}

function getBody(spamDomain, rawSpam){
  return `To whom it may concern, \n
          I am writing to you today to report the following domain: ${spamDomain}. \n
          This domain is sending me unsolocited spam emails. \n
          Please take appropriate measures to avoid future abuse from this user. \n
          You will find the raw spam email below: \n
          ${rawSpam}`;
}

function extractDomain(author){
  return author.split("@")[1].split(">")[0];
}

function getAbuseEmail(domain){
  return browser.storage.local.get("server").then((item) => async function(){
    var url = item.server + domain;
    var headers = {
      "Content-Type": "application/json",
      "x-api-key": "API-KEY"
    }
    var fetchInfo = {
        mode: "cors",
        method: "GET",
        headers: headers
    };
    var response = await fetch(url, fetchInfo);
    return await response.json();
  });
}
