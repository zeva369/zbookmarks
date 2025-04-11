
let db = null;
let sidePanelOpen = false;

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'side-panel.html',
      enabled: true
    });
});

const onChromeBookmarkCreated = (id, bookmark) => {
  /*const transaction = db.transaction(["bookmarks","bookmark_tags"], "readwrite");
  transaction.objectStore("bookmarks").add({
    id: id,
    title: bookmark.title,
    url: bookmark.url,
  });
  
  transaction.objectStore("bookmark_tags").add({
    bookmark: bookmark.id,
    tag: "nuevo",
  });
  transaction.objectStore("bookmark_tags").add({
    bookmark: bookmark.id,
    tag: "clave",
  });
  transaction.oncomplete = () => {
    console.log("Datos insertados correctamente.");
  };

  if (sidePanelOpen) {
    chrome.runtime.sendMessage({
      type: 'BOOKMARK_CREATED',
      message: 'Nuevo marcador creado: ' + bookmark.title
    });
  }*/
  
}

const onChromeBookmarkChanged = (id, changeInfo) => {
  const titleParts = changeInfo.title.split("::");
 

  const transaction = db.transaction(["bookmarks","bookmark_tags"], "readwrite");
  transaction.objectStore("bookmarks").get(id).onsuccess = (event) => {
    const bookmark = event.target.result;
    if (bookmark) {
      bookmark.title = titleParts[1];
      transaction.objectStore("bookmarks").put(bookmark);
    }
  }

  titleParts[0].split(",").forEach((tag) => {
    transaction.objectStore("bookmark_tags").add({
      bookmark: id,
      tag: tag.trim(),
    });
  });
  transaction.oncomplete = () => {
    console.log("Datos insertados correctamente.");
  };
}

function initDatabase() {
  const request = indexedDB.open("zbookmarks", 1);

  //Crea la base de datos
  request.onupgradeneeded = function (event) {
    db = event.target.result;

    if (db.objectStoreNames.contains("folders")) db.deleteObjectStore("folders");
    if (db.objectStoreNames.contains("bookmarks")) db.deleteObjectStore("bookmarks");
    if (db.objectStoreNames.contains("tags")) db.deleteObjectStore("tags");
    if (db.objectStoreNames.contains("bookmark_tags")) db.deleteObjectStore("bookmark_tags");

    db.createObjectStore("folders", { keyPath: "id" });     //El id deberia ser el mismo que utiliza chrome
    const bookmarksStore = db.createObjectStore("bookmarks", { keyPath: "id" });  
    bookmarksStore.createIndex("id", "id", { unique: true });

    const tagsStore = db.createObjectStore("tags", { keyPath: "key" });        //El id del tag es el tag en si mismo
    tagsStore.createIndex("key", "key", { unique: false });

    const bookmarkTagsStore = db.createObjectStore("bookmark_tags", { keyPath: "id", autoIncrement: true  });
    bookmarkTagsStore.createIndex("bookmark", "bookmark", { unique: false });
    bookmarkTagsStore.createIndex("tag", "tag", { unique: false });
  };
  request.onsuccess = function (event) {
    //Guardo la referencia a la base de datos
    db = event.target.result;
  };
}

/*
chrome.sidePanel.onPanelShown.addListener(() => {
  chrome.runtime.sendMessage({ type: "SIDE_PANEL_OPEN", value: true });
  //chrome.storage.local.set({ sidePanelOpen: true });
});

chrome.sidePanel.onPanelHidden.addListener(() => {
  chrome.runtime.sendMessage({ type: "SIDE_PANEL_OPEN", value: false });
  //chrome.storage.local.set({ sidePanelOpen: false });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SIDE_PANEL_OPEN") {
    sidePanelOpen = message.value;
  }
});*/

function initChromeEvents() {
  chrome.bookmarks.onCreated.addListener(onChromeBookmarkCreated);
  chrome.bookmarks.onChanged.addListener(onChromeBookmarkChanged);
}

initDatabase();
initChromeEvents();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CREATE_BOOKMARK") {
    const { title, url, parentId, bookmarkTags } = message.data;
    
    chrome.bookmarks.create({ title, url, parentId }, (newBookmark) => {
      const transaction = db.transaction(["bookmarks","bookmark_tags"], "readwrite");
      transaction.objectStore("bookmarks").add({
        id: newBookmark.id,
        title: newBookmark.title,
        url: newBookmark.url,
      });
      const store = transaction.objectStore("bookmark_tags");
  
      bookmarkTags.forEach((tag) => {
        store.add({ bookmark: newBookmark.id, tag: tag.trim() });
      });
  
      transaction.oncomplete = () => {
        sendResponse({ success: true, bookmark: newBookmark });
      };

      transaction.onerror = (event) => {
        sendResponse({ success: false, error: event.target.error.message });
      }
    });

    

    // Indica que la respuesta será enviada de forma asíncrona
    return true;
  }
});
