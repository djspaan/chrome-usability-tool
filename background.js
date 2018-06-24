chrome.history.search({text: '', maxResults: 100}, function(data) {
    // get pages
    let pages = [];
    for (let i = 0; i < data.length; i++) {
        pages.push({
            id: data[i].id,
            url: data[i].url,
            next: i !== data.length - 1 ? data[i+1].url : null,
            links: []
        });
    }
    // get links
    for (let i = 0; i < pages.length; i++) {
        $.get(pages[i].url, function(data) {
            let links = $(data).find('a');
            for (let link of links) {
                pages[i].links.push({
                    url: link.getAttribute('href'),
                    // TODO: better way for same website
                    toCurrentWebsite: !!link.href.indexOf(pages[i].url),
                    textLength: link.innerHTML.length,
                    hasLinkNeighbours: !!$(link).siblings().find('a').length,
                    isClicked: i !== pages.length - 1 ? link.href === pages[i+1].url : false
                });
            } // store
        }).then(function() {
            if (i === pages.length - 1) {
                chrome.storage.local.set({easePages: pages});
            }
        });
    }
});