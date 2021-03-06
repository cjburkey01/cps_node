'use strict';

$(document).ready(init);

const perPage = 8;

let reloadButton;
let prevPageButton;
let nextPageButton;
let pageText;
let loadingImg;
let dogList;

let page = 0;
let maxPage = 0;

function init() {
    reloadButton = $('#reloadDogs');
    dogList = $('#dogList');
    loadingImg = $('#imgLoading');
    prevPageButton = $('#prevPage');
    nextPageButton = $('#nextPage');
    pageText = $('#pageNumberText');
    
    reloadButton.click(e => {
        e.preventDefault();
        reloadDogs();
    });
    prevPageButton.click(e => {
        e.preventDefault();
        if (!loading) page--;
        reloadDogs();
    });
    nextPageButton.click(e => {
        e.preventDefault();
        if (!loading) page++;
        reloadDogs();
    });
    
    reloadDogs();
}

// This is what each dog's thumbnail looks like in plain HTML
// String interpolation/templates are used to make it nicer to work with
const dogThumbnailTemplate = (id, name, url) => {
    return `
        <div class="col-6 col-sm-4 col-md-3" style="padding-bottom: 15px;">
            <a class="dog-list-link" href="/dogs/${id}">
                <div class="dog-list-item">
                    <img class="img-fluid" src="${url}" alt="Picture of ${name}"/>
                    <h3 class="text-center font-weight-normal dog-list-name">${name}</h3>
                </div>
            </a>
        </div>
    `;
};

let loading = false;

function reloadDogs() {
    // Clamp the page number to make sure it's correct
    if (page >= maxPage) page = maxPage - 1;
    if (page < 0) page = 0;
    
    // Make sure an existing request doesn't exist
    if (loading) return;
    
    // Skip if the page has failed to load (somehow)
    if (dogList == null) {
        console.log('Failed to locate dog list element');
        alert('There was an error while loading the dog list. Please try reloading the page.');
        return;
    }
    
    // Update the loading state
    loading = true;
    markLoading(true);
    
    // Retrieve a list of available dogs
    getDogs(perPage, page, dogs => {
        // Empty the existing dog thumbnails
        dogList.html('');
        
        // Add the new dogs to the list
        console.log(`Loaded ${dogs.length} dogs`);
        for (let i in dogs) {
            dogList.append(dogThumbnailTemplate(dogs[i].animalID, dogs[i].animalName, dogs[i].animalPictures[0].original.url))
        }
        
        // Update the loading state
        markLoading(false);
        loading = false;
    });
}

// Update graphics to match loading status
function markLoading(loading) {
    if (loading) {
        prevPageButton.addClass('disabled');
        nextPageButton.addClass('disabled');
        if (reloadButton != null) {
            reloadButton.html('Loading...');
            reloadButton.addClass('disabled');
            loadingImg.show();
        }
    } else {
        if (page > 0) prevPageButton.removeClass('disabled');
        if (page < maxPage - 1) nextPageButton.removeClass('disabled');
        if (reloadButton != null) {
            reloadButton.html('Reload list');
            reloadButton.removeClass('disabled');
            loadingImg.hide();
        }
        pageText.html(`Page ${page + 1}/${maxPage}`);
    }
}

function getDogs(perPageRaw, pageRaw, callback) {
    const perPage = parseInt(perPageRaw, 10);
    const page = parseInt(pageRaw, 10);
    if (perPage < 1 || page < 0) callback([]);
    
    $.ajax({
        url: `/api/dog_list/${perPage}/${page}`,
    }).done(e => {
        if (e === null || e.data === null) {
            alert('An error occurred while loading the available dogs. Please try reloading the page.');
            callback([]);
            return;
        }
        if (e.error !== null) {
            alert(`${e.data.error}. Please try reloading the page.`);
            callback([]);
            return;
        }
        maxPage = Math.ceil(e.foundRows / perPage);
        
        let dogs = [];
        for (let dogId in e.data) dogs.push(e.data[dogId]);
        
        callback(dogs);
    });
}
