export class RestManager {
  constructor(onXmlLoadedCallback, showCodeDivCallback) {
    this.restCount = 0;
    this.restInitSuccess = false;
    this.onXmlLoadedCallback = onXmlLoadedCallback; // Expects (xhr)
    this.showCodeDivCallback = showCodeDivCallback; // Expects (boolean)
  }

  getSavedXml() {
    const url = 'http://localhost:8081/api';
    const rc = this.restCount++;
    const xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = () => {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        this.restInitSuccess = true;
        if (this.showCodeDivCallback) this.showCodeDivCallback(false);
        if (this.onXmlLoadedCallback) this.onXmlLoadedCallback(xhttp);
      } else if (xhttp.readyState == 4) {
        if (this.showCodeDivCallback) this.showCodeDivCallback(true);
      }
    };

    xhttp.open("GET", url, true);
    xhttp.send();
  }

  async postCode(code, typ) {
    if (!this.restInitSuccess) {
      console.debug("REST-Service not yet initialized. Code not posted.");
      return;
    }

    const url = 'http://localhost:8081/api';
    const rc = this.restCount++;
    const xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = () => {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        console.debug(`<<< POST-${typ}[${rc}]: ${xhttp.status}`);
      } else if (xhttp.readyState == 4) {
        console.debug(`<<< POST-${typ}[${rc}]: ${xhttp.status}`);
        if (this.showCodeDivCallback) this.showCodeDivCallback(true);
      }
    };

    console.debug(`>>> POST-${typ}[${rc}]: ${url}`);
    xhttp.open("POST", url, true);

    if (typ === "xml") {
      xhttp.setRequestHeader("Content-type", "text/xml");
    } else if (typ === "java") {
      xhttp.setRequestHeader("Content-type", "text/java");
    }

    xhttp.send(code);
  }
}
