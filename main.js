
class createQueryFunctions {
  createUrlWithType(type) {
    let baseUrl = "https://api.harvardartmuseums.org/"
    return new URL(baseUrl + type);
  }

  getBaseParameters() {
    let apiKey = "b686c200-ce6e-11e9-8209-e166c8671f51";
    let baseQueryParameters = {
      apikey: apiKey,
      size: 100,
    }
    return baseQueryParameters
  }

  addParameter(key, value, queryParameters) {
    queryParameters[key] = value
  }

  addParamsToEndpoint(params, endpoint) {
    Object.keys(params).forEach(key => endpoint.searchParams.append(key, params[key]))
  }

  async fetchEndpoint(endpoint) {
    let res = await fetch(endpoint);
    return await res.json();
  }
}

// gets every gallery name and displays each as a button 
// the button holds a call to showObjectData
async function getGalleries() {
  let galleryType = "gallery"

  let createQuery = new createQueryFunctions();
  let galleryEndpoint = createQuery.createUrlWithType(galleryType)
  let baseParameters = createQuery.getBaseParameters()
  createQuery.addParamsToEndpoint(baseParameters, galleryEndpoint)

  let galleryIdsNames = [];

  let currGalleryData = await createQuery.fetchEndpoint(galleryEndpoint);
  
  while (true) {
    for (let i = 0; i < currGalleryData.records.length; i++) {
      let currGalleryDiv = document.createElement("div");
      document.body.appendChild(currGalleryDiv); 

      let btn = document.createElement("BUTTON");
      currGalleryDiv.append(btn);

      btn.innerHTML = currGalleryData.records[i].name;
      btn.className = "buttonBlock";
      
      btn.onclick = () => showObjectData(currGalleryData.records[i].id, currGalleryDiv, true)
    }

    if (currGalleryData.info.next == undefined) {
      break;
    }

    currGalleryData = await createQuery.fetchEndpoint(currGalleryData.info.next);
  }

}

/*
* galleryObject is either an id of an object or the object data
* parentElement is the div html element to be written into 
* getData is a boolean for if galleryObject is the data or is an id that needs to be fetched
*/
async function showObjectData(galleryObject, parentElement, getData) {
  let galleryObjectData;
  if (getData) {
    galleryObjectData = await getGalleryObjects(galleryObject);
  }
  else {
    galleryObjectData = galleryObject;
  }

  for (let i = 0; i < galleryObjectData.length; i++) {
    let currObjectDiv = document.createElement("div");
    let p = document.createElement("span")
    let objectName;
    if (galleryObjectData[i].title != undefined) {
      objectName = galleryObjectData[i].title;
    }
    else {
      objectName = galleryObjectData[i].displayname;
    }
    let para = document.createTextNode(objectName + ": ");
    p.append(para)
    currObjectDiv.append(p);

    parentElement.append(currObjectDiv)
    
    let showMore = document.createElement("BUTTON");
    currObjectDiv.append(showMore);
    showMore.innerHTML = "Show More (Images Load Slowly)!";
    showMore.className = "buttonBlock";
    showMore.onclick = function() {
      showJsonData(galleryObjectData[i], currObjectDiv)
      showAvailableImages(currObjectDiv, galleryObjectData[i]);
    }
  }

  if (galleryObjectData.length == 0) {
    let noObjects = document.createTextNode("No Contained Objects");
    parentElement.append(noObjects);
  }
}

function showJsonData(jsonData, parentElement) {
  let jsonElement = document.createElement("pre")
  jsonElement.innerHTML = JSON.stringify(jsonData, undefined, 2);
  parentElement.append(jsonElement);
  showAvailableImages(parentElement, jsonData);
}

//gets all the gallery objects given a gallery id
async function getGalleryObjects(galleryId) {
  let objectType = "object"

  let createQuery = new createQueryFunctions();
  let objectEndpoint = createQuery.createUrlWithType(objectType)
  let params = createQuery.getBaseParameters()
  createQuery.addParameter("gallery", galleryId, params) 
  createQuery.addParamsToEndpoint(params, objectEndpoint)

  let galleryObjectIdNames = [];

  let currGalleryObjectData = await createQuery.fetchEndpoint(objectEndpoint)

  while (true) {
    for (let i = 0; i < currGalleryObjectData.records.length; i++) {
      galleryObjectIdNames.push(currGalleryObjectData.records[i])
    }

    if (currGalleryObjectData.info.next == undefined) {
      break;
    }
    currGalleryObjectData = await createQuery.fetchEndpoint(currGalleryObjectData.info.next )
  }

  console.log(galleryObjectIdNames)

  return galleryObjectIdNames;
}

// record is an object record that has images in it's first level
// shows all the images in a record
async function showAvailableImages(currObjectDiv, record) {

  let images = [];
  if (record.images != undefined) {
    for (let i = 0; i < record.images.length; i++) {
      let pngImageUrl = record.images[i].iiifbaseuri + "/full/full/0/default.png";
      console.log("PNG", pngImageUrl)
      let pngResponse = await fetch(pngImageUrl)
      if (pngResponse.status == 400) {
        let jpgImageUrl = record.images[i].iffbaseuri + "/full/full/0/default.jpg";
        images.push(jpgImageUrl)
      }
      else {
        images.push(pngImageUrl)
      }
    }
  }
  
  if (record.primaryimageurl != undefined) {
    images.push(record.primaryimageurl)
  }
  
  for (i in images) {
    let img = document.createElement('img');
    img.src = images[i];
    img.style.maxWidth = "300px";
    img.onclick = function() { 
      if (img.style.maxWidth == "300px") {
        img.style.maxWidth = "";
      }
      else {
        img.style.maxWidth = "300px";
      }
    }
    currObjectDiv.append(img)
  }
  console.log("IMAGES", images)
}

// queries given a type (hits url/{type}) and parameters to query on
async function query(objectType, objectParameters) {

  let createQuery = new createQueryFunctions();
  let objectEndpoint = createQuery.createUrlWithType(objectType)
  
  let params = createQuery.getBaseParameters()
  Object.keys(objectParameters).forEach(function (key) { 
    let value = objectParameters[key]
    createQuery.addParameter(key, value, params) 
  })
  console.log(params)
  createQuery.addParamsToEndpoint(params, objectEndpoint)

  let objectsFound = [];

  let currObjectData = await createQuery.fetchEndpoint(objectEndpoint)
  
  console.log("curr object data", currObjectData);
  while (true) {
    for (let i = 0; i < currObjectData.records.length; i++) {
      objectsFound.push(currObjectData.records[i])
    }

    if (currObjectData.info.next == undefined) {
      break;
    }
    currObjectData = await createQuery.fetchEndpoint(currObjectData.info.next)
  }

  console.log("Current Object Data", objectsFound)
  return objectsFound;
}

/* 
* This is the function the html is calling when someone searches for something 
* the function is passed in the html elements that are relevant as they all the have same className
* the afterFormDiv is the div element after the form where the output should be written to
* the endpointName is the type (endpoint/{type})
*/
async function searchParams(className, afterFormDiv, endpointName) {
  let queryParamsHtml = document.getElementsByClassName(className);
  queryParams = {}
  for (let i = 0; i < queryParamsHtml.length; i++) {
    if (queryParamsHtml[i].value != "") {
      queryParams[queryParamsHtml[i].name] = queryParamsHtml[i].value;
    }
  }

  let currSearchDiv = document.getElementById(afterFormDiv);
  currSearchDiv.innerHTML = "";

  switch (endpointName) {
    case "object": {
      objectsFound = await query("object", queryParams);
      await showObjectData(objectsFound, currSearchDiv, false)
      break;
    }
    case "exhibition": {
      exhibitionsFound = await query("exhibition", queryParams);
      await showObjectData(exhibitionsFound, currSearchDiv, false)
      break;
    } 
    case "person": {
      peopleFound = await query("person", queryParams);
      await showObjectData(peopleFound, currSearchDiv, false)
      break;
    }
    case "publication": {
      publicationsFound = await query("publication", queryParams);
      await showObjectData(publicationsFound, currSearchDiv, false)
      break;
    }
  }
}