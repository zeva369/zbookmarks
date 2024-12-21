 
document.getElementById('insertButton').addEventListener('click', async () => {

  try {

    // Consultamos los grupos de pestañas
    const groups = await new Promise((resolve, reject) => {
      chrome.tabGroups.query({}, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });

    if (groups.length === 0) {
      console.log("No hay grupos de pestañas disponibles.");
      return;
    }

    // Creamos una lista de grupos con sus pestañas correspondientes
    const groupDetails = await Promise.all(groups.map(async (group) => {
      
      const tabs = await new Promise((resolve, reject) => {
        chrome.tabs.query({ groupId: group.id }, (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result);
          }
        });
      });
      
      return {
        id: group.id,
        title: group.title || "Sin título",
        color: group.color,
        tabs: tabs.map(tab => ({
          id: tab.id,
          title: tab.title,
          url: tab.url
        }))
      };
    }));
   
    const port = chrome.runtime.connect({ name: "popup-to-sidepanel" });
    port.postMessage({ action: "listGroups", groups: groupDetails });


/*
    // Ahora que tenemos todos los detalles, enviamos el mensaje al content script
    const activeTabs = await new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });

    if (activeTabs.length === 0) {
      console.log("No hay pestañas activas.");
      return;
    }

    const activeTabId = activeTabs[0].id;


    // Enviar los grupos de tareas al content script
    chrome.tabs.sendMessage(activeTabId,{ action: "listGroups", groups: groupDetails }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error al enviar mensaje:", chrome.runtime.lastError.message);
      } else {
        console.log("Respuesta del content script:", response);
      }
    });*/

  } catch (error) {
    console.error("Error en el flujo asincrónico:", error);
  }

});