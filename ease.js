import {DecisionTreeClassifier as DTClassifier} from 'ml-cart';

const PREDICTION_WEIGHT = 0.5;

const container = initContainer();

let tree = {};
let pages = [];

chrome.storage.local.get(['easePages'], function (history) {
    // get links
    pages = history['easePages'];
    let trainingSet = [];
    let predictions = [];
    for (let i = 0; i < pages.length; i++) {
        for (let j = 0; j < pages[i].links.length; j++) {
            trainingSet.push([+pagesContainLink(pages, pages[i].links[j]), +pages[i].links[j].toCurrentWebsite, pages[i].links[j].textLength, +pages[i].links[j].hasLinkNeighbours]);
            predictions.push(getClassForLink(pages, pages[i].links[j]));
        }
    }

    // predict
    let options = {
        gainFunction: 'gini',
        maxDepth: 10,
        minNumSamples: 3
    };
    tree = new DTClassifier(options);
    tree.train(trainingSet, predictions);

    initStyling();
    arrangeButtons();
    addEventListeners();

});

function arrangeButtons() {
    let links = document.querySelectorAll('a');
    let linksHTML = '';
    for (let i = 0; i < links.length; i++) {
        linksHTML += arrangeButton(links[i]);
    }
    container.innerHTML = linksHTML;
}

function addEventListeners() {
    let links = document.querySelectorAll('.ease-link');
    for (let i = 0; i < links.length; i++) {
        links[i].addEventListener('mouseenter', function(event) {
            let href = event.target.getAttribute('href');
            let relatedLink = document.querySelector(`a[href$="${href}"]`);
            relatedLink.classList.add('ease-hover');
            relatedLink.scrollIntoView(false);
        });
        links[i].addEventListener('mouseleave', function(event) {
            let href = event.target.getAttribute('href');
            let relatedLink = document.querySelector(`a[href$="${href}"]`);
            relatedLink.classList.remove('ease-hover');
        });
    }
}

function arrangeButton(link) {
    let wantedPosition = getWantedPosition(link);
    return createButton(link, wantedPosition.x, wantedPosition.y, wantedPosition.width, wantedPosition.height);
}

function getWantedPosition(link) {
    let screenDimensions = getScreenDimension();

    let relativeX = link.getBoundingClientRect().left / screenDimensions.width;
    let relativeY = link.getBoundingClientRect().top / screenDimensions.height;

    let wantedX = relativeX * getElementWidth(container);
    let wantedY = relativeY * getElementHeight(container);

    let relativeWidth = getElementWidth(link) / screenDimensions.width;
    let relativeHeight = getElementHeight(link) / screenDimensions.height;

    let wantedWidth = relativeWidth * getElementWidth(container);
    let wantedHeight = relativeHeight * getElementHeight(container);

    let linkObject = getLinkObject(link);
    let linkClass = tree.predict([[+pagesContainLink(pages, linkObject), +linkObject.toCurrentWebsite, linkObject.textLength, +linkObject.hasLinkNeighbours]]);

    return {x: wantedX, y: wantedY, width: wantedWidth * linkClass * PREDICTION_WEIGHT, height: wantedHeight * linkClass * PREDICTION_WEIGHT}
}

function getLinkObject(link) {
    return {
        url: link.getAttribute('href'),
        // TODO: better way for same website
        toCurrentWebsite: !!link.href.indexOf(window.location.href),
        textLength: link.innerHTML.length,
        hasLinkNeighbours: !!$(link).siblings().find('a').length,
        isClicked: false
    }
}

function createButton(link, x, y, w, h) {
    return `<a href="${link.getAttribute('href')}" class="ease-link" style="left: ${x}px; top: ${y}px; width:${w}px; height:${h}px;background-color:${getRandomColor()};"></a>`;
}

function getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getElementWidth(element) {
    return element.getBoundingClientRect().right - element.getBoundingClientRect().left;
}

function getElementHeight(element) {
    return element.getBoundingClientRect().bottom - element.getBoundingClientRect().top;
}

function getScreenDimension() {
    return {
        width: document.body.scrollWidth,
        height: document.body.scrollHeight
    };
}

function initContainer() {
    let dimensions = getScreenDimension();
    let container = document.createElement('div');
    container.classList.add('ease-container');
    container.style.width = dimensions.width / 4 + 'px';
    container.style.height = dimensions.height / 4 + 'px';
    document.body.appendChild(container);
    return container;
}

function initStyling() {
    let css = `
        .ease-container {
            position: fixed;
            top:0;
            right:0;
            z-index:10000000;
            background:rgba(255, 255, 255, 0.64);
        }
        
        .ease-link {
            position:absolute;
            background: red; 
            width: 20px; 
            height: 20px;
            min-width: 10px;
            min-height: 10px;
            margin: 5px;
        }
        
        .ease-hover {
            display: inline-block !important;
            transform: scale(1.5);
            z-index: 100000;
        }
        
        a {
            transition: all 0.2s ease-in-out !important;
        }
        
    `;
    let style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
}

function getClassForLink(pages, link) {
    if (link.isClicked || pagesContainLink(pages, link)) {
        return 5;
    } else if (link.toCurrentWebsite && link.hasLinkNeighbours) {
        return 4;
    } else if (link.toCurrentWebsite && (link.hasLinkNeighbours || link.textLength > 10)) {
        return 3;
    } else if (link.toCurrentWebsite && link.textLength > 10) {
        return 2;
    } else {
        return 1;
    }
}

function pagesContainLink(pages, link) {
    for (let page of pages) {
        if (page.url === link.url) {
            return true;
        }
    }
    return false;
}