let typingTimer; // Temporizador para detectar inactividad
const typingDelay = 500; // Tiempo en milisegundos (0.5 segundos)

function loadTopLevelFolders() {
  const container = document.querySelector(".container");
  const searchBar = document.querySelector(".search-bar");

  removeChildren(container);
  container.appendChild(searchBar);

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

function loadItemChildren(event) {
  const element = event.currentTarget;
  const parent = element.parentNode;
  const contentElement = getContentElement(parent);

  //If collapsed -> Expand
  if (element.classList.contains('collapsed')) {

    chrome.bookmarks.getChildren(element.id, (children) => {

      if (children.length) {

        children.forEach((child) => {

          const bookmark = document.createElement("div");
          bookmark.backgroundColor = (child.url ? "#FFFFFF" : "#e3d44b");

          if (child.url) {
            bookmark.classList.add("bookmark");
            bookmark.innerText = child.title;
            bookmark.id = child.id;

            const faviconUrl = "https://www.google.com/s2/favicons?domain=" + new URL(child.url).hostname;
            bookmark.innerHTML = `
                          <img src="${faviconUrl}" alt="Favicon" style="width: 16px; height: 16px; margin-right: 8px;">
                          <a href="${child.url}" target="_blank">${child.title}</a>
                          `;

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
          tab.innerHTML = `
                          <img src="${faviconUrl}" alt="Favicon" style="width: 16px; height: 16px; margin-right: 8px;">
                          <a href="${child.url}" target="_blank">${child.title}</a>
                          `;  

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

function addBookmark(bookmark) {
  const bmark = document.createElement("div");
  bmark.backgroundColor = (bookmark.url ? "#FFFFFF" : "#e3d44b");

  bmark.classList.add("bookmark");
  bmark.innerText = bookmark.title;
  bmark.id = bookmark.id;

  const faviconUrl = "https://www.google.com/s2/favicons?domain=" + new URL(bookmark.url).hostname;
  bmark.innerHTML = `
                <img src="${faviconUrl}" alt="Favicon" style="width: 16px; height: 16px; margin-right: 8px;">
                <a href="${bookmark.url}" target="_blank">${bookmark.title}</a>
                `;
  return bmark;
}

function search(element) {
  const query = element.toLowerCase();
    
  if (query != null && query != '') {
    const container = document.querySelector(".container");
    const tabGroupContainer = document.querySelector(".tab-group-container");
    const searchBar = document.querySelector(".search-bar");

    removeChildren(container);
    removeChildren(tabGroupContainer);
    container.appendChild(searchBar);
  
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

      allBookmarks.filter((bookmark) => bookmark.title.toLowerCase().includes(query))
      .map((element) => container.appendChild(addBookmark(element)));
    });
  } else {
    loadTopLevelFolders();
  }  

}

function initSearchBar() {
  const inputElement = document.getElementById('searchInput');

  //Add event listener para detectar cuando
  inputElement.addEventListener('input', (event) => {
    clearTimeout(typingTimer); // Resetea el temporizador si se sigue escribiendo

    typingTimer = setTimeout(() => {
      search(event.target.value);
    }, typingDelay); // Espera un tiempo después del último input
  });
}

function initDatabase() {
  const request = indexedDB.open("zbookmarks", 5);

  //Crea la base de datos
  request.onupgradeneeded = function (event) {
    const db = event.target.result;

    if (db.objectStoreNames.contains("folders")) db.deleteObjectStore("folders");
    if (db.objectStoreNames.contains("bookmarks")) db.deleteObjectStore("bookmarks");
    if (db.objectStoreNames.contains("tags")) db.deleteObjectStore("tags");

    db.createObjectStore("folders", { keyPath: "id" });     //El id deberia ser el mismo que utiliza chrome
    db.createObjectStore("bookmarks", { keyPath: "id" });  
    tagsStore = db.createObjectStore("tags", { keyPath: "id" });        //El id del tag es el tag en si mismo
    
    if (tagsStore.indexNames.contains("bookmark_id")) {
      console.log("Borrando indice...");
      tagsStore.deleteObjectStore("bookmark_id");
    }
    tagsStore.createIndex("bookmark_id", "bookmark_id", { unique: false });
  };

  //Agrega elementos
  const addData = (db) => {
    const transaction = db.transaction(["folders", "bookmarks", "tags"], "readwrite");

    const folderStore = transaction.objectStore("folders");
    const bookmarkStore = transaction.objectStore("bookmarks");
    const tagsStore = transaction.objectStore("tags");

    // folderStore.put({ id: 1, name: "Libros" });

    folderStore.get(1).onsuccess = (e) => {
      console.log("Carpeta: ", e.target.result);
    };

    // bookmarkStore.put({ id: 1, url:"https://www.amazon.es/ca%C3%ADda-N%C3%BAmenor-Biblioteca-J-Tolkien/dp/8445015052/ref=sr_1_8?__mk_es_ES=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=6HDZUHI43NG8&dib=eyJ2IjoiMSJ9.o1gL6MUHOI8S4Vg03RYAupLM18edQDkAn1_XludP6MT_8DZZsQC2eXql3KHDVnJjNEzf_WaotXRVS-ibVCiUDDB_ZI9-86yxO6MCgFOKwBjWuNEPUqPy1m79zl0s0OQRBKj1x-7MfkqMVNw-vqY9EjLrn2F5oRwfPbNKRoc0fIa_Pu2SxOGgF7N2pWAvYGhE8BSjC3beUT8y2gG3WwMdsxYcxXUxEDggeJw8XRaH3d3fqnTGCURZTGlwavaUD5c5qinBE54RrvAlD6dPL9dACrq9A1JHpcA6Ml6KG9_p6YbJrPHyiNsoMaqhnSX4339Q7uXCJxnEwS0h7h1j3graQRf_VF0okz2ae4C5tq8GW3iUi2MOilNayJkLb0RfRaBSAGYdAeabUBdTmarStF5H_37dFTtengQfcOHiw3tBubib8ejf8s_qxDcGSRY9ntev.1KS_ty5KqhGiyaUOaorAVVQyG0Wy2qPFhNX2vVwMQbs&dib_tag=se&keywords=libro&nsdOptOutParam=true&qid=1734258778&sprefix=libro%2Caps%2C176&sr=8-8" });

    bookmarkStore.get(1).onsuccess = (e) => {
      console.log("Marcador: ", e.target.result);
    };
    
    const tags = [
      { id: "Tolkien" , bookmark_id: 1},
      { id: "caída" , bookmark_id: 1},
      { id: "minotauro", bookmark_id: 1},
      { id: "brian" , bookmark_id: 1},
      { id: "sibley" , bookmark_id: 1},
    ];

    // tags.forEach((tag) => tagsStore.add(tag));

    tagsStore.get("Tolkien").onsuccess = (e) => {
      console.log("Tag: ", e.target.result);
    };

    transaction.oncomplete = () => {
      console.log("Datos insertados correctamente.");
    };

    transaction.onerror = (event) => {
      console.error("Error al insertar datos:", event.target.error);
    };

    //Consulto todos los tags del bookmark
    const bookmarkIdIndex = tagsStore.index("bookmark_id");

    const request = bookmarkIdIndex.getAll(1);

    request.onsuccess = () => {
      console.log(`Tags del bookmark con ID ${1}:`, request.result);
    };

    request.onerror = () => {
      console.error("Error al obtener los tags del bookmark.");
    };

  };

  request.onsuccess = function (event) {
    const db = event.target.result;
    addData(db);
  };

}

function initialize() {
  initDatabase();
  loadTopLevelFolders();
  initSearchBar();
}

// Cargar las carpetas al cargar la página
document.addEventListener("DOMContentLoaded", initialize);


