let ws;
let serverHost = "localhost:8080"
let whoami = 'Unknown'
let receiver = 'Unknown'

function connect() {
    getHistory();
    let url = "ws://" + serverHost + "/chat/" + whoami;
    ws = new WebSocket(url);

    ws.onopen = function (event) {
        let btn = document.getElementById('connect')
        btn.innerHTML = 'Connected'
        btn.disabled = 'true'
    }

    ws.onmessage = function (event) {
        let log = document.getElementById("chat-messages");
        let message = JSON.parse(event.data);
        log.innerHTML += message.nameFrom + " : " + message.content + "\n";
    };

    ws.onclose = function (event) {
        setTimeout(function () {
            connect();
        }, 1000);
    }

    ws.onerror = function (event) {
        ws.close()
    }
}


function getHistory() {
    let xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            if (this.status === 200) {
                let log = document.getElementById("chat-messages");
                let messages = JSON.parse(this.responseText);
                messages.forEach((m) => {
                    log.innerHTML += m.nameFrom + " : " + m.content + "\n";
                })
            } else {
                showError("Error:" + JSON.parse(this.responseText).message)
            }
        }
    }

    xhr.open("GET", "http://" + serverHost +
        "/v1.0/messages?userFrom=" + whoami + "&userTo=" + receiver + "&export=false", true)
    xhr.send()
}

function send() {
    let content = document.getElementById("msg").value;
    let json = JSON.stringify({
        "nameFrom": whoami,
        "nameTo": receiver,
        "content": content,
        "dateTime": new Date().toISOString()
    });
    ws.send(json);
}

function addUser() {
    document.getElementById("any-error").style.visibility = "hidden"
    let xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            if (this.status === 200) {
                refreshUsers()
            } else {
                showError("Error:" + this.status + ", " + this.responseText)
            }
        }
    }
    let userName = document.getElementById("new-user").value
    let newUser = {
        name: userName
    }
    let jsonBody = JSON.stringify(newUser)

    xhr.open("POST", "http://" + serverHost + "/v1.0/users", true)
    xhr.send(jsonBody)
}

function refreshUsers() {
    let xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function () {
        if (this.readyState === 4) {
            if (this.status === 200) {
                let usersList = JSON.parse(this.responseText)
                let select = document.getElementById("users")
                removeOptions(select)

                let unknown = document.createElement('option');
                unknown.value = 'Unknown';
                unknown.innerHTML = 'Unknown';
                select.appendChild(unknown);
                select.options[0].disabled = 'true'

                let receivers = document.getElementById("receivers")
                removeOptions(receivers)
                let rUnknown = document.createElement('option');
                rUnknown.value = 'Unknown';
                rUnknown.innerHTML = 'Unknown';
                receivers.appendChild(rUnknown);
                receivers.options[0].disabled = 'true'

                usersList.forEach((value) => {
                    let opt = document.createElement('option');
                    opt.value = value.name;
                    opt.innerHTML = value.name;
                    select.appendChild(opt);
                    if (value.name !== whoami) {
                        let rOpt = document.createElement('option');
                        rOpt.value = value.name;
                        rOpt.innerHTML = value.name;
                        receivers.appendChild(rOpt);
                    }
                })
                select.value = whoami
                receivers.value = receiver
            } else {
                showError("Error:" + this.status)
            }
        }
    }
    xhr.open("GET", "http://" + serverHost + "/v1.0/users", true)
    xhr.send()
}

function removeOptions(selectElement) {
    let i, L = selectElement.options.length - 1;
    for (i = L; i >= 0; i--) {
        selectElement.remove(i);
    }
}

function updateWhoami() {
    let lastWhoami = whoami
    let usersSelect = document.getElementById("users")
    whoami = usersSelect.value;
    if (whoami === receiver) {
        receiver = 'Unknown'
        document.getElementById('send-to').innerHTML = 'Send to: ' + receiver
    }
    document.getElementById('whoami').innerHTML = 'Whoami: ' + whoami
    usersSelect.options[0].disabled = 'true'

    let receiversSelect = document.getElementById("receivers")
    let optionsArr = receiversSelect.options
    for (let i = 0; i < optionsArr.length; i++) {
        if (optionsArr[i].value === lastWhoami) {
            receiversSelect.options[i].disabled = 'false'
        }
        if (optionsArr[i].value === whoami) {
            receiversSelect.options[i].disabled = 'true'
        }
    }
}

function updateReceiver() {
    let receiversSelect = document.getElementById("receivers")
    receiver = receiversSelect.value;
    document.getElementById('send-to').innerHTML = 'Send to: ' + receiver
}


function downloadHistory() {
    let xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            if (this.status === 200) {
                let type = xhr.getResponseHeader('Content-Type');
                let blob = new Blob([this.response], { type: type });
                saveOrOpenBlob(blob)
            } else {
                showError("Error:" + this.status + ", " + this.responseText)
            }
        }
    }
    xhr.open("GET", "http://" + serverHost +
        "/v1.0/messages?userFrom=" + whoami + "&userTo=" + receiver + "&export=true", true)
    xhr.send()
}

function showError(err) {
    document.getElementById("any-error").style.color = "red"
    document.getElementById("any-error").style.visibility = "visible"
    document.getElementById("any-error").innerHTML = ("Error:" + err)
    setTimeout(() => {
        document.getElementById("any-error").style.visibility = "hidden"
    }, 5000)
}

function saveOrOpenBlob(blob) {
    let fileName = 'history_' + whoami + '_' + receiver + '.txt'
    let tempEl = document.createElement("a");
    document.body.appendChild(tempEl);
    tempEl.style = "display: none";
    let url = window.URL.createObjectURL(blob);
    tempEl.href = url;
    tempEl.download = fileName;
    tempEl.click();
    window.URL.revokeObjectURL(url);
}
