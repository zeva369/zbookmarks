let typingTimer;         // Temporizador para detectar inactividad
const typingDelay = 500; // Tiempo en milisegundos (0.5 segundos)
let db = null;
const handleEditButtonClicked = (event) => {
  event.stopPropagation(); // Evitar que el evento de clic se propague al contenedor padre
  const editButtonId = event.currentTarget.id.replace("edit_", "");
  showBookmarkOptions(editButtonId);
};


function loadTopLevelFolders() {
  const container = document.querySelector(".container");
  const toolBar = document.querySelector(".toolbar");
  //const searchBar = document.querySelector(".search-bar");

  removeChildren(container);
  container.appendChild(toolBar);
  //container.appendChild(searchBar);
  

  chrome.bookmarks.getTree((bookmarkTreeNodes) => {
    const rootNode = bookmarkTreeNodes[0]; // Nodo raíz del árbol de marcadores
    const topLevelFolders = rootNode.children || []; // Hijos directos de la raíz

    // Filtrar solo las carpetas
    const folders = topLevelFolders.filter((node) => node.children);

    folders.forEach((folder) => {
      const folderElement = document.createElement("div");
      folderElement.classList.add("folder");

      //Now add two elements (the title and the content)

      const folderTitle = document.createElement("div");
      folderTitle.classList.add("folder-title");
      folderTitle.classList.add("collapsed");
      //<img class="plus" src="./plus.png" width="20px;" height="auto"/>
      folderTitle.innerHTML = `<div class="down"><i class="fa-solid fa-caret-down"></i></div>
                               <div class="right"><i class="fa-solid fa-caret-right"></i></div>
                               <i class="fa-regular fa-folder"></i>
                               <div style="width:100%;">${folder.title}</div>`;
      folderTitle.id = folder.id;
      folderTitle.addEventListener("click", (event) => loadItemChildren(event));
      folderElement.appendChild(folderTitle);

      const folderContent = document.createElement("div");
      folderContent.classList.add("folder-content");
      folderContent.classList.add("collapsed");
      folderElement.appendChild(folderContent);

      container.appendChild(folderElement);
    });
  });

  const colors = {
     "blue" : "#8ab4f8",
     "yellow": "#fdd663",
     "purple": "#c58af9",
     "grey": "#dadce0",
     "red": "#f28b82",
     "cyan": "#78d9ec",
     "orange": "#fcad70",
     "green": "#81c995",
     "pink": "#ff8bcb"
    }

  //Load tab groups
  const tabGroupContainer = document.querySelector(".tab-group-container");
  chrome.tabGroups.query({}, (tabGroups) => {
      tabGroups.forEach((tabGroup) => {	
       const  tabGroupElement = document.createElement("div");
       tabGroupElement.classList.add("folder");

       const tabGroupTitle = document.createElement("div");
       tabGroupTitle.classList.add("folder-title");
       tabGroupTitle.id = tabGroup.id;
       let elementColor = colors[tabGroup.color]; 
       tabGroupTitle.classList.add("collapsed");
       tabGroupTitle.innerHTML = `<div class="down"><i class="fa-solid fa-caret-down"></i></div>
                                <div class="right"><i class="fa-solid fa-caret-right"></i></div>
                                <span class="material-symbols-outlined" style="color:${elementColor}">tab_group</span>
                                <div style="width:100%;color:${elementColor};">${tabGroup.title}</div>`;
       tabGroupTitle.addEventListener("click", (event) => loadTabGroupChildren(event));
       tabGroupElement.appendChild(tabGroupTitle);
       
       const tabGroupContent = document.createElement("div");
       tabGroupContent.classList.add("folder-content");
       tabGroupContent.classList.add("collapsed");
       tabGroupElement.appendChild(tabGroupContent);

       tabGroupContainer.appendChild(tabGroupElement);
     });
  });
}

function getTagsByBookmarkId(bookmarkId) {
  return new Promise((resolve, reject) => {
    const store = db.transaction("bookmark_tags", "readonly").objectStore("bookmark_tags");
    const index = store.index("bookmark");
    const cursorRequest = index.openCursor(IDBKeyRange.only(bookmarkId));

    const results = [];

    cursorRequest.onsuccess = () => {
      const cursor = event.target.result;
      if (cursor) {
        results.push(cursor.value.tag);
        cursor.continue();                    // Continúa con el siguiente registro, esto provocará otro evento onsuccess
      } else {
        resolve(results);                     // Cuando ya no haya más registros, resuelve la promesa
      }
    };
    cursorRequest.onerror = () => {
      reject(new Error("Error al abrir el cursor"));
    };
  });
}

const loadItemChildren = async (event) => {
  const element = event.currentTarget;
  const parent = element.parentNode;
  const contentElement = getContentElement(parent);

  //If collapsed -> Expand
  if (element.classList.contains('collapsed')) {

    chrome.bookmarks.getChildren(element.id, async (children) => {

      if (children.length) {

        //children.forEach((child) => {
        for (const child of children) {

          const bookmark = document.createElement("div");
          bookmark.backgroundColor = (child.url ? "#FFFFFF" : "#e3d44b");

          //Es un link
          if (child.url) {
            //Consulto los tags en la base de datos 
            const result = await getTagsByBookmarkId(child.id);
            let str = "";
            if (result) str = result.join(" | ");

            bookmark.classList.add("bookmark");
            bookmark.title = str;
            bookmark.innerText = child.title;
            bookmark.id = child.id;

            const faviconUrl = "https://www.google.com/s2/favicons?domain=" + new URL(child.url).hostname;
            const editButtonId = "edit_" + child.id;
            bookmark.innerHTML = `<img src="${faviconUrl}" alt="Favicon" style="width: 16px; height: 16px; margin-right: 8px;">
                                  <a href="${child.url}" target="_blank">${child.title}</a>
                                  <div id="${editButtonId}" class="edit"><i class="fa-solid fa-pen-to-square"></i></div>`;
            
            const editButton = bookmark.querySelector('#' + editButtonId);
            editButton.addEventListener('click', (event) => handleEditButtonClicked(event));
          } else {
            bookmark.classList.add("folder");

            const folderTitle = document.createElement("div");
            folderTitle.classList.add("folder-title");
            folderTitle.classList.add("collapsed");
            folderTitle.innerHTML = `<div class="down"><i class="fa-solid fa-caret-down"></i></div>
                                     <div class="right"><i class="fa-solid fa-caret-right"></i></div>
                                     <!--<i class="fa-regular fa-folder"></i>-->
                                     <div class="right"><span class="material-symbols-outlined">folder</span></div>
                                     <div class="down"><span class="material-symbols-outlined">folder_open</span></div>
                                     <div style="width:100%;">${child.title}</div>`;
            folderTitle.id = child.id;
            folderTitle.addEventListener("click", (event) => loadItemChildren(event));
            bookmark.appendChild(folderTitle);

            const folderContent = document.createElement("div");
            folderContent.classList.add("folder-content");
            folderContent.classList.add("collapsed");
            bookmark.appendChild(folderContent);
          }

          contentElement.appendChild(bookmark);
        } //);
        contentElement.classList.remove("collapsed");
        contentElement.classList.add("expanded");

        element.classList.remove("collapsed");
        element.classList.add("expanded");
      } else {
        //Ver como eliminar el signo + cuando no tiene hijos
      }

    });

  //If Expanded -> Collapse 
  } else {
    removeChildren(contentElement);
    contentElement.classList.remove("expanded");
    contentElement.classList.add("collapsed");

    element.classList.remove("expanded");
    element.classList.add("collapsed");
  }
}

function loadTabGroupChildren(event) {
  const element = event.currentTarget;
  const parent = element.parentNode;
  const contentElement = getContentElement(parent);

  //If collapsed -> Expand
  if (element.classList.contains('collapsed')) {

    chrome.tabs.query({ groupId: parseInt(element.id) }, (tabs) => {

      if (tabs.length) {
        tabs.forEach((child) => {

          const tab = document.createElement("div");
          tab.backgroundColor = (child.url ? "#FFFFFF" : "#e3d44b");
          
          tab.classList.add("bookmark");
          tab.innerText = child.title;
          tab.id = child.id;

          const faviconUrl = "https://www.google.com/s2/favicons?domain=" + new URL(child.url).hostname;
          const editButtonId = "edit_" + child.id;
          tab.innerHTML = `<img src="${faviconUrl}" alt="Favicon" style="width: 16px; height: 16px; margin-right: 8px;">
                          <a href="${child.url}" target="_blank">${child.title}</a>
                          <div id="${editButtonId}" class="edit"><i class="fa-solid fa-pen-to-square"></i></div>`;  
          const editButton = tab.querySelector('#' + editButtonId);
          editButton.addEventListener('click',(event) => handleEditButtonClicked(event));
          contentElement.appendChild(tab);
        });
        contentElement.classList.remove("collapsed");
        contentElement.classList.add("expanded");

        element.classList.remove("collapsed");
        element.classList.add("expanded");
      } else {
        //Ver como eliminar el signo + cuando no tiene hijos
      }

    });

  //If Expanded -> Collapse 
  } else {
    removeChildren(contentElement);
    contentElement.classList.remove("expanded");
    contentElement.classList.add("collapsed");

    element.classList.remove("expanded");
    element.classList.add("collapsed");
  }
}

function getContentElement(parent) {
  if (parent != null) {
    if (parent.children) {
      for (const child of parent.children) {
        if (child.classList.contains("folder-content")) return child;
      }
    }
  }
  return null;
}

function removeChildren(element) {
  if (element != null) {
    while (element.firstChild) {
      element.removeChild(element.lastChild);
    }
  }
}

function getBookmarkElement(bookmark) {
  const bmark = document.createElement("div");
  bmark.backgroundColor = (bookmark.url ? "#FFFFFF" : "#e3d44b");

  bmark.classList.add("bookmark");
  bmark.innerText = bookmark.title;
  bmark.id = bookmark.id;

  const faviconUrl = "https://www.google.com/s2/favicons?domain=" + new URL(bookmark.url).hostname;
  const editButtonId = "edit_" + bookmark.id;
  bmark.innerHTML = `<img src="${faviconUrl}" alt="Favicon" style="width: 16px; height: 16px; margin-right: 8px;">
                     <a href="${bookmark.url}" target="_blank">${bookmark.title}</a>
                     <div id="${editButtonId}" class="edit"><i class="fa-solid fa-pen-to-square"></i></div>`;
  const editButton = bmark.querySelector('#' + editButtonId);
  editButton.addEventListener('click', (event) => handleEditButtonClicked(event));
  return bmark;
}

function showBookmarkOptions(bookmarkId){
  const transaction = db.transaction(["bookmarks", "tags"], "readwrite");
  const bookmarkStore = transaction.objectStore("bookmarks");
  
}

function search(value) {
  const query = value.toLowerCase();
    
  if (query != null && query != '') {
    const container = document.querySelector(".container");
    const tabGroupContainer = document.querySelector(".tab-group-container");
    //const searchBar = document.querySelector(".search-bar");
    const toolBar = document.querySelector(".toolbar");

    removeChildren(container);
    removeChildren(tabGroupContainer);
    container.appendChild(toolBar);
    //container.appendChild(searchBar);
  
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      let allBookmarks = [];
	
      // Función recursiva para recorrer el árbol de marcadores
      function extractBookmarks(bookmarkNodes) {
        bookmarkNodes.forEach(node => {
          if (node.url) {
            // Si el nodo tiene una URL, es un marcador
            allBookmarks.push({
              title: node.title,
              url: node.url
            });
          }
          
          // Si el nodo tiene hijos (es una carpeta), recursivamente extraer los marcadores
          if (node.children) {
            extractBookmarks(node.children);
          }
        });
      }

      // Llamar a la función recursiva
      extractBookmarks(bookmarkTreeNodes);

      allBookmarks.filter((b) => b.title.toLowerCase().includes(query))
        .forEach((b) => container.appendChild(getBookmarkElement(b)));
    });
  } else {
    loadTopLevelFolders();
  }  
}

function initSearchBar() {
  const inputElement = document.getElementById('searchInput');

  //Add event listener para detectar cuando
  inputElement.addEventListener('input', (event) => {
    let value = event.target.value;
    clearTimeout(typingTimer);                                    // Resetea el temporizador si se sigue escribiendo
    typingTimer = setTimeout(() => search(value), typingDelay);   // Espera un tiempo después del último input
  });
}

async function findFolderByName(folderName) {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      let foundFolder = null;

      // Función recursiva para buscar la carpeta
      function searchFolders(nodes) {
        for (const node of nodes) {
          if (node.title === folderName && node.children) {
            foundFolder = node;
            return;
          }
          if (node.children) {
            searchFolders(node.children);
          }
        }
      }

      searchFolders(bookmarkTreeNodes);

      if (foundFolder) {
        resolve(foundFolder);
      } else {
        reject(new Error(`Carpeta con el nombre "${folderName}" no encontrada.`));
      }
    });
  });
}

function initDatabase() {
  //indexedDB.deleteDatabase("zbookmarks"); //Elimino la base de datos para crearla de nuevo
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
    //addData(db);
  };

}

function initializeChromeMessages() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'BOOKMARK_CREATED') {
      // Aquí puedes mostrar el modal
      alert(message.message);  // Solo como ejemplo, podrías usar un modal real
      // O usar algo como un modal de HTML:
      //showModal(message.message);
    }
  });
}

async function getCurrentTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        resolve(tabs[0]);
      } else {
        reject(new Error("No se encontraron pestañas activas."));
      }
    });
  });
}

function initModal() {
  const modal = document.getElementById('myModal');
  const closeBtn = document.querySelector('.close');
  const addBookmarkBtn = document.getElementById('addBookmarkBtn');

  closeBtn.onclick = () => {
    modal.style.display = 'none';
  };

  window.onclick = (e) => {
    if (e.target == modal) {
      modal.style.display = 'none';
    }
  };  

  document.getElementById("addBookmark").addEventListener("click", async () => {
    const modal = document.getElementById('myModal');
    const bookmarkUrl = document.getElementById('bookmarkUrl');
    const bookmarkTitle = document.getElementById('bookmarkTitle');
    const curTab = await getCurrentTab();
    bookmarkTitle.value = curTab.title; 
    bookmarkUrl.value = curTab.url;
    modal.style.display = 'block';    
  });

  addBookmarkBtn.onclick = () => {
    const bookmarkTitle = document.getElementById('bookmarkTitle').value;
    const bookmarkUrl = document.getElementById('bookmarkUrl').value;
    const bookmarkTags = document.getElementById('tags').value.split(',');
    const folder = document.getElementById('folder').value;
    
    findFolderByName(folder)
      .then((folder) => {
          chrome.runtime.sendMessage(
            {
              type: "CREATE_BOOKMARK",
              data: {
                title: bookmarkTitle,
                url: bookmarkUrl,
                parentId: folder.id,
                bookmarkTags: bookmarkTags,
              },
            },
            (response) => {
              if (response.success) {
                console.log("Bookmark creado:", response.bookmark);
              } else {
                console.error("Error al crear el marcador:", response.error);
              }
            }
          );
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

function initialize() {
  initDatabase();
  loadTopLevelFolders();
  initSearchBar();
  initializeChromeMessages();
  initModal();
}

// Cargar las carpetas al cargar la página
document.addEventListener("DOMContentLoaded", initialize);



