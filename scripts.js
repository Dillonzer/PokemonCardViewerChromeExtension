var AllCards = [];
var AllSets = [];
var tcgplayerauthtoken = ""
var slideIndex = 1

function Set(name, code, ptcgo_code, releaseDate)
{
    this.Name = name;
    this.Code = code;
    this.PTCGO_Code = ptcgo_code;
    this.ReleaseDate = releaseDate;
}

function Card(name, set, setCode, setNumber, releaseDate, image, tcgPlayerCardId, tcgPlayerCardUrl)
{
    this.Name = name;
    this.Set = set;
    this.SetCode = setCode;
    this.SetNumber = setNumber;
    this.ReleaseDate = releaseDate;
    this.Image = image;
    this.TCGPlayerId =  tcgPlayerCardId;
    this.TCGPlayerUrl = tcgPlayerCardUrl;
}

window.onload = function()
{
    EventListeners()
    GetTCGPlayerAuth()

    chrome.storage.session.get(["session"]).then((result) => {
    if(result.session != undefined && result.session)
    {
        LoadLocalStorageState()
    }
    else
    {
        chrome.storage.local.clear()
        this.Setup(GetAllSets);  
    }
  });
}

async function LoadLocalStorageState()
{    
    let currentCard = document.getElementById("cardName")
    let currentSet = document.getElementById("setName")
    let searchTerm = document.getElementById("txt_cardName")

    await chrome.storage.local.get(["cards"]).then((result) => {
        AllCards = result.cards
    });
    await chrome.storage.local.get(["sets"]).then((result) => {
        AllSets = result.sets
    });    

    SetSetListBoxes(GetAllCardsInSetNoParam); 

    await chrome.storage.local.get(["currentSet"]).then((result) => {
        currentSet.selectedIndex = result.currentSet
    });
    
    await chrome.storage.local.get(["currentCard"]).then((result) => {
        currentCard.selectedIndex = result.currentCard
        GetSpecificCardNoParam()
    });

    await chrome.storage.local.get(["slideshowIndex"]).then((result) => {
        slideIndex = result.slideshowIndex
    });
    
    await chrome.storage.local.get(["searchTerm"]).then((result) => {
        if(result.searchTerm != undefined)
        {
            searchTerm.value = result.searchTerm
            GetCardsForSlideShow(searchTerm.value)
        }
    });
}

function Setup(GetAllSetsCallback)
{
    GetAllSetsCallback(GetAllCards)
}

function GetAllSets(GetAllCardsCallback)
{
    var language = "en_US";
    var apiUrl = "https://raw.githubusercontent.com/Dillonzer/dillonzer.github.io/master/data/sets.json";
            fetch(apiUrl).then(response => {
            return response.json();
            }).then(data => {
                for(index in data) {
                    if(language != "en_US")
                    {
                        if(Date.parse(data[index].releaseDate) > Date.parse('2010-01-01'))
                        {
                            AllSets.push(new Set(data[index].name, data[index].code, data[index].ptcgoCode, data[index].releaseDate));
                        }
                    }
                    else
                    {                        
                        AllSets.push(new Set(data[index].name, data[index].code, data[index].ptcgoCode, data[index].releaseDate));
                    }
                }
                chrome.storage.local.set({sets: AllSets})
                GetAllCardsCallback(SetSetListBoxes);
            }).catch(err => {
                RefreshSection()
                console.log(err)
            });
}

function GetAllCards(SetSetListBoxCallback)
{
    var cardCounter = 0
    var language = "en_US"
    var apiUrl = "https://raw.githubusercontent.com/Dillonzer/dillonzer.github.io/master/data/cards.json"
        fetch(apiUrl).then(response => { 
            return response.json(); 
        }).then(data => {
            for(index in data) {
                AllCards.push(new Card(data[index].name, data[index].set.name, data[index].set.code, data[index].number, data[index].set.releaseDate, data[index].imageUrlHiRes, data[index].tcgPlayerCardId, data[index].tcgPlayerCardUrl))
                cardCounter++ 
            }     

            if(cardCounter === data.length)
            {                 
                chrome.storage.local.set({cards: AllCards})
                chrome.storage.session.set({session: true})     
                SetSetListBoxCallback(GetAllCardsInSetNoParam); 
            }

        }).catch(err => {
            RefreshSection()
            console.log(err)
        });
    
}

function RefreshSection()
{
    var img = document.getElementById("loadingImg").style.display="none";
    document.getElementById("refreshSection").style.display = "block"
}

function Refresh()
{    
    AllCards = [];
    AllSets = [];

    document.getElementById("refreshSection").style.display = "none"
    document.getElementById("loadingImg").style.display="inline";
    document.getElementById("cardName").style.display="none"; 
    document.getElementById("setName").style.display="none";
    document.getElementById("cardImage").style.display="none";
    document.getElementById("tabHeader").style.display="none";
    document.getElementById("div_BySet").style.display="none";
    document.getElementById("div_ByCardName").style.display="none";
    
    Setup(GetAllSets)
}

function SetSetListBoxes(GetCallCardsInSetCallBack)
{
    var setSelect = document.getElementById("setName")
    var sortedSets = AllSets.sort((a,b) => Date.parse(b.ReleaseDate) - Date.parse(a.ReleaseDate))
    
    var j, L = setSelect.options.length - 1;
    for(j = L; j >= 0; j--) {
        setSelect.remove(j);
    }

    for(var i = 0; i < sortedSets.length; i++)
    {
        setSelect.options[setSelect.options.length] = new Option(sortedSets[i].Name + " (" + sortedSets[i].PTCGO_Code + ")", sortedSets[i].Code);
    }

    chrome.storage.local.get(["currentSet"]).then((result) => {
        if(result.currentSet != undefined)
        {           
            setSelect.selectedIndex = result.currentSet; 
        }
        
        GetCallCardsInSetCallBack()
    });

}


function GetAllCardsInSetNoParam()
{
    var setCode = document.getElementById("setName");
    GetAllCardsInSet(setCode.value)
}

function GetAllCardsInSet(setCode)
{ 
    var cardSelect = document.getElementById("cardName")
    var cardsInSet = AllCards.filter(cards => cards.SetCode === setCode)
    var sortedCardsInSet = cardsInSet.sort((a,b) => (a.Name > b.Name) ? 1 : ((b.Name > a.Name) ? -1 : 0))
    cardSelect.options.length = 0;
    for (let i = 0; i < sortedCardsInSet.length; i++)
    {
        cardSelect.options[cardSelect.options.length] = new Option(sortedCardsInSet[i].Name + " (" + sortedCardsInSet[i].SetNumber + ")", sortedCardsInSet[i].Image);
    }
    chrome.storage.local.get(["currentCard"]).then((result) => {
        if(result.currentCard != undefined)
        {           
            cardSelect.selectedIndex = result.currentSet; 
        }
        
    GetSpecificCardNoParam()
    });
}

function GetSpecificCardNoParam()
{
    var cardId = document.getElementById("cardName");
    
    GetSpecificCard(cardId.value)

    if(document.getElementById("loadingImg").style.display != "none")
    {
        HideLoadImage()
    }

    for(var i = 0; i <= AllCards.length; i++)
    {
        if(AllCards[i].Image == cardId.value)
        {
            GetTCGPlayerPricesForBySet(AllCards[i].TCGPlayerId,AllCards[i].TCGPlayerUrl)
            break
        }
    }

    SetLocalStorage()
}

function GetSpecificCard(image)
{    
    var img = document.getElementById("cardImage")
    img.src = image
}

function HideLoadImage()
{    
    var img = document.getElementById("loadingImg").style.display="none";
    var cardSelect = document.getElementById("cardName").style.display="inline"; 
    var setCode = document.getElementById("setName").style.display="inline";
    var img = document.getElementById("cardImage").style.display="inline";
    var tab = document.getElementById("tabHeader").style.display="block";
    
    
    chrome.storage.local.get(["selectedTab"]).then((result) => {  
        if(result.selectedTab == undefined)
        {
            document.getElementById('btn_BySet').click()   
        }
        else
        {
            OpenTab(result.selectedTab)
        }
    });
}

function OpenTab(tabName) {
    var i, tabcontent;
    chrome.storage.local.set({selectedTab: tabName})
    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    if(tabcontent.length === 0)
    {        
        tabcontent = document.getElementsByClassName("m_tabcontent");
    }

    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById('div_'+tabName).style.display = "block";
    document.getElementById('btn_'+tabName).className += " active";
}   

function EventListeners()
{
    document.getElementById("setName").addEventListener("change",function() {GetAllCardsInSetNoParam()})
    document.getElementById("cardName").addEventListener("change",function() {GetSpecificCardNoParam()})
    document.getElementById("btn_BySet").addEventListener("click",function() {OpenTab("BySet")})    
    document.getElementById("btn_ByCardName").addEventListener("click",function() {OpenTab("ByCardName")})
    document.getElementById("btn_searchCardByName").addEventListener("click",function() {GetCardsForSlideShowNoParam()})
    document.getElementById("txt_cardName").addEventListener("keyup",function() {GetCardsForSlideShowNoParamEnter(event)})
    document.getElementById("prevSlide").addEventListener("click",function() {plusSlides(-1)})
    document.getElementById("nextSlide").addEventListener("click",function() {plusSlides(1)})  
    document.getElementById("btn_refresh").addEventListener("click",function() {Refresh()})   
}

//SLIDESHOW STUFF

function GetCardsForSlideShowNoParam()
{
    var cardName = document.getElementById("txt_cardName");
    slideIndex = 1
    chrome.storage.local.set({searchTerm: cardName.value})
    chrome.storage.local.set({slideshowIndex: slideIndex})
    GetCardsForSlideShow(cardName.value)
}

function GetCardsForSlideShowNoParamEnter(event)
{
        // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        
        slideIndex = 1
        var cardName = document.getElementById("txt_cardName");
        GetCardsForSlideShow(cardName.value)
    }
}

async function GetCardsForSlideShow(name)
{    
    var img = document.getElementById("loadingImg2").style.display="block";
    document.getElementById("prevSlide").style.display = "none"  
    document.getElementById("nextSlide").style.display = "none"
    var mobile = false
    tabcontent = document.getElementsByClassName("tabcontent");
    if(tabcontent.length === 0)
    {        
        mobile = true
    }
    var imgs = document.getElementsByClassName("dynamicImage")
    while(imgs.length > 0) {
        imgs[0].parentNode.removeChild(imgs[0]);  
    }

    name = name.replace("`","'")
    name = name.replace("’","'")
    var nameWithHyphens = name.replace(" ","-").toLowerCase();
    var nameWithoutHyphens = name.replace("-"," ").toLowerCase()    
    var nameReplaceAnd = name.replace("and", "&").toLowerCase()
    var lowerCaseName = name.toLowerCase();

    var cardsByName = AllCards.filter(cards => 
        cards.Name.toLowerCase() === nameWithHyphens || 
        cards.Name.toLowerCase() === nameWithoutHyphens || 
        cards.Name.toLowerCase() === nameReplaceAnd || 
        cards.Name.toLowerCase() === lowerCaseName.trim() || 
        cards.Name.toLowerCase() === lowerCaseName || 
        cards.Name.toLowerCase().includes(lowerCaseName) ||
        cards.Name.toLowerCase().includes(nameWithHyphens) ||
        cards.Name.toLowerCase().includes(nameWithoutHyphens) ||
        cards.Name.toLowerCase().includes(nameReplaceAnd) ||
        cards.Name.toLowerCase().includes(lowerCaseName.trim()))
    var sortedCardsByName = cardsByName.sort((a,b) => Date.parse(b.ReleaseDate) - Date.parse(a.ReleaseDate))

    for(let i = 0; i < sortedCardsByName.length; i++)
    {
        var myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + tcgplayerauthtoken);
        myHeaders.append("Accept", "application/json");
        myHeaders.append("Content-Type", "application/json");

        var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
        };

        var response = await fetch("https://api.tcgplayer.com/v1.39.0/pricing/product/"+sortedCardsByName[i].TCGPlayerId, requestOptions)
        
        var data = await response.json();

        var dynamicDiv = document.createElement("div");
        dynamicDiv.className += "mySlides fade dynamicImage"
        var imgElem = document.createElement("img");
        var captionElem = document.createElement("div");
        captionElem.className += " slideshowText"
        var tcgPlayerElem = document.createElement("div");
        tcgPlayerElem.className += " tcgPrices"
        if(mobile)
        {
            imgElem.className += " m_cardSize"
            imgElem.style.paddingLeft = "15px"
        }
        else
        {
            imgElem.className += " s_cardSize"

        }
        imgElem.src = sortedCardsByName[i].Image
        captionElem.innerHTML = sortedCardsByName[i].Set + " </br> Release Date: " + sortedCardsByName[i].ReleaseDate
        var pTag = document.createElement("p")
        var lowPrice = document.createElement("span")
        var medPrice = document.createElement("span")
        var highPrice = document.createElement("span")
        var tcgimg = document.createElement("span")
        //var tcgimg2 = document.createElement("img")
        tcgPlayerElem.appendChild(pTag)
        pTag.appendChild(lowPrice)
        pTag.appendChild(medPrice)
        pTag.appendChild(highPrice)
        tcgPlayerElem.appendChild(tcgimg)
        //tcgimg.appendChild(tcgimg2)
        lowPrice.className += " lowPrice"
        medPrice.className += " medPrice"
        highPrice.className += " highPrice"        
        tcgimg.className += " tcgplayerinfo"
        tcgimg.innerHTML = "Market Prices from TCGPlayer"
        //tcgimg2.className += " tcgplayerimg"
        //tcgimg2.src = "./images/TCGplayer-logo-primary.png"

        document.getElementById("slideshow").appendChild(dynamicDiv);
        dynamicDiv.appendChild(imgElem);
        dynamicDiv.appendChild(captionElem);
        dynamicDiv.appendChild(tcgPlayerElem);
        for(k = 0; k < data.results.length; k++)
        {
            if(data.results[k].subTypeName == "Holofoil")
            {
                if(data.results[k].marketPrice != null)
                {
                    lowPrice.style.display = ""
                    lowPrice.innerHTML = "<a href='"+sortedCardsByName[i].TCGPlayerUrl+"' target='_blank'>Holo: $"+data.results[k].marketPrice+"</a>"
                }
                else
                {
                    lowPrice.style.display = "none"
                }
            }
            
            if(data.results[k].subTypeName == "Reverse Holofoil")
            {
                if(data.results[k].marketPrice != null)
                {
                    medPrice.style.display = ""
                    medPrice.innerHTML = "<a href='"+sortedCardsByName[i].TCGPlayerUrl+"' target='_blank'>Reverse: $"+data.results[k].marketPrice+"</a>"
                }
                else
                {
                    medPrice.style.display = "none"
                }
            }

            
            if(data.results[k].subTypeName == "Normal")
            {
                if(data.results[k].marketPrice != null)
                {
                    highPrice.style.display = ""
                    highPrice.innerHTML = "<a href='"+sortedCardsByName[i].TCGPlayerUrl+"' target='_blank'>Normal: $"+data.results[k].marketPrice+"</a>"
                }
                else
                {
                    highPrice.style.display = "none"
                }
            }
        }
        

        if(sortedCardsByName.length <= 0)
        {
            var dynamicDiv = document.createElement("div");
            dynamicDiv.className += "mySlides fade dynamicImage"
            var pElem = document.createElement("p");
            pElem.className += " loadingText"
            pElem.innerHTML = "Could not find a card containing '" + name + "'"
            document.getElementById("slideshow").appendChild(dynamicDiv);
            dynamicDiv.appendChild(pElem);
        }

    }

    showSlides(slideIndex)
}

// Next/previous controls
function plusSlides(n) {  
  showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {  
  showSlides(slideIndex = n);
}

function showSlides(n) {
  var img = document.getElementById("loadingImg2").style.display="none";
  var i;
  var slides = document.getElementsByClassName("mySlides");
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
  }
  slides[slideIndex-1].style.display = "block";
  document.getElementById("prevSlide").style.display = "block"  
  document.getElementById("nextSlide").style.display = "block"

  var cardName = document.getElementById("txt_cardName");
  chrome.storage.local.set({searchTerm: cardName.value})
  chrome.storage.local.set({slideshowIndex: slideIndex})
}

function GetTCGPlayerAuth() {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "text/plain");

    var raw = "grant_type=client_credentials&client_id="+TCGPLAYER_CLIENT_ID+"&client_secret="+TCGPLAYER_CLIENT_SECRET;

    var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
    };

    fetch("https://api.tcgplayer.com/token", requestOptions)
    .then(response => { return response.json() })
    .then(data => {
        tcgplayerauthtoken = data.access_token
    })
    .catch(error => console.log('error', error));
}

function GetTCGPlayerPricesForBySet(id,link)
{
    var lowPrice = document.getElementById("lowTcgPrice")
    var medPrice = document.getElementById("medTcgPrice")
    var highPrice = document.getElementById("highTcgPrice")

    var myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + tcgplayerauthtoken);
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Content-Type", "application/json");

    var requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
    };

    fetch("https://api.tcgplayer.com/v1.39.0/pricing/product/"+id, requestOptions)
    .then(response => {return response.json()})
    .then(data => {
        for(i = 0; i < data.results.length; i++)
        {
            if(data.results[i].subTypeName == "Holofoil")
            {
                if(data.results[i].marketPrice != null)
                {
                    lowPrice.style.display = ""
                    lowPrice.innerHTML = "<a href='"+link+"' target='_blank'>Holo: $"+data.results[i].marketPrice+"</a>"
                }
                else
                {
                    lowPrice.style.display = "none"
                }
            }
            
            if(data.results[i].subTypeName == "Reverse Holofoil")
            {
                if(data.results[i].marketPrice != null)
                {
                    medPrice.style.display = ""
                    medPrice.innerHTML = "<a href='"+link+"' target='_blank'>Reverse: $"+data.results[i].marketPrice+"</a>"
                }
                else
                {
                    medPrice.style.display = "none"
                }
            }

            
            if(data.results[i].subTypeName == "Normal")
            {
                if(data.results[i].marketPrice != null)
                {
                    highPrice.style.display = ""
                    highPrice.innerHTML = "<a href='"+link+"' target='_blank'>Normal: $"+data.results[i].marketPrice+"</a>"
                }
                else
                {
                    highPrice.style.display = "none"
                }
            }
        }
    })
    .catch(error => console.log('error', error));
}

function SetLocalStorage()
{    
    let currentCard = document.getElementById("cardName")
    let currentSet = document.getElementById("setName")
    chrome.storage.local.set({currentCard: currentCard.selectedIndex})
    chrome.storage.local.set({currentSet: currentSet.selectedIndex})
}
