/*
// Evita duplicados si el script ya está cargado.
if (!document.querySelector("#mi-barra-lateral")) {
  // Crear un contenedor para la barra lateral
  const sidebar = document.createElement("div");
  sidebar.id = "mi-barra-lateral";
  sidebar.style.position = "fixed";
  sidebar.style.top = "0";
  sidebar.style.left = "0";
  sidebar.style.width = "300px";
  sidebar.style.height = "100%";
  sidebar.style.backgroundColor = "white";
  sidebar.style.borderRight = "2px solid #ccc";
  sidebar.style.zIndex = "9999";
  sidebar.style.overflow = "auto";
  sidebar.style.boxShadow = "2px 0 5px rgba(0,0,0,0.1)";
  sidebar.style.padding = "10px";
  
  // Botón para cerrar la barra lateral
  const closeButton = document.createElement("button");
  closeButton.textContent = "Cerrar";
  closeButton.style.position = "absolute";
  closeButton.style.top = "10px";
  closeButton.style.right = "10px";
  closeButton.style.cursor = "pointer";

  closeButton.addEventListener("click", () => {
    sidebar.remove();
  });

  // Contenido de la barra lateral
  const content = document.createElement("div");
  content.innerHTML = "<h2>Mi Barra Lateral</h2><p>Contenido personalizado.</p>";

  sidebar.appendChild(closeButton);
  sidebar.appendChild(content);

  // Añadir la barra lateral al cuerpo del documento
  document.body.appendChild(sidebar);
}

*/

//chrome.runtime.onMessage.addListener((message, sender, sendResponse) => 

chrome.runtime.onConnect.addListener((port) => { 
if (port.name === "popup-to-sidepanel") {
    port.onMessage.addListener((message) => {

 if (message.action === "listGroups") {
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

    const contenedor = document.createElement("div");
    contenedor.classList.add("container");

    message.groups.forEach(group => {

    	const groupDiv = document.createElement("div");
    	groupDiv.classList.add('tab-group');
        groupDiv.style.backgroundColor=colors[group.color];
    	const title = document.createElement("div");
        title.innerText = group.title;
	title.classList.add('tab-group-title');
        groupDiv.appendChild(title);

    	contenedor.appendChild(groupDiv);

        group.tabs.forEach(tab => {
          const tabDiv = document.createElement("div");
    	  tabDiv.classList.add('tab');
    	  tabDiv.innerText = tab.title;
           //const img = document.createElement("img");
           //img.src = tab.screenshot;
           //tabDiv.appendChild(img);
    	  groupDiv.appendChild(tabDiv);
	});
   });
   
   document.body.appendChild(contenedor);
    
   sendResponse({ status: "Grupos mostrados en la página." });

   } 
   return true;
  
   });
  }

});
