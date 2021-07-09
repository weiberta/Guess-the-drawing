const socket = io()
const $messages = document.querySelector("#messages")

const msgtemplate = document.querySelector("#msg-template").innerHTML
const sidebartemplate = document.querySelector('#user-rooms').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    const $newmsg = $messages.lastElementChild
    const newmsgStyles = getComputedStyle($newmsg)

    const newMsgMargin = parseInt(newmsgStyles.marginBottom)
    const newmsgheight = $newmsg.offsetHeight + newMsgMargin


    const visibleHeight = $messages.offsetHeight
    const containerHeght = $messages.scrollHeight
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeght - newmsgheight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}
// how is the data processed and shown
socket.on("message", (msg) => {
    console.log(msg)
    const html = Mustache.render(msgtemplate, {
        username: msg.username,
        msg: msg.text,
        createdAt: moment(msg.createdAt).format('h:m A, DD MMM,YYYY')
    })

    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})


socket.on("roomData", ({ room, users }) => {
    document.querySelector('#sidebar').innerHTML = Mustache.render(sidebartemplate, {
        room,
        users
    })
})

socket.on("sentence", (msg) => {
    console.log(msg)
    document.querySelector('#sentenceInput').innerHTML = msg

})


socket.emit('join', { username, room }, (error) => {

    if (error) {
        alert(error)
        location.href = '/'
    }
    sentence()
}
)

function sentence()
{
    let sentence = prompt("Enter a Sentence")

    socket.emit("sentence", sentence, (error) => {
        if (error) {
            return console.log(error)
        }
        console.log('Sentence delivered!')
    })
}


//*♦—◊——◊——◊—〈  C A N V A S F U N K T I O N E N  〉—◊——◊——◊—♦*//

const canvas = document.querySelector("#canvas");
canvas.width = 0.65 * window.innerWidth;

if (window.innerWidth < 850)
    canvas.height = 0.2 * window.innerHeight;
else
    canvas.height = 0.7 * window.innerHeight;

let context = canvas.getContext("2d");
context.fillStyle = "white";
context.fillRect(0, 0, canvas.width, canvas.height);

let startBackgroundColor = "white";
let drawColor = "black";
let drawWidth = "2";
let isDrawing = false;

let undoButton = document.querySelector("#undo");
undoButton.addEventListener("pointerup", undoLast);
let clearButton = document.querySelector("#clear");
clearButton.addEventListener("pointerup", clearCanvas);
let saveButton = document.querySelector("#save");
saveButton.addEventListener("pointerup", save);

let restoreArray = [];
let index = -1;

// source: G. Rausch
var colorPickers = document.querySelectorAll(".color-field");
for (var i = 0; i < colorPickers.length; i++) {
    var colorPicker = colorPickers[i];
    // this click handler is going to be adapted for touch, thus a separate handle
    // is not needed
    colorPicker.addEventListener("pointerup", changeColor, false);
}

/* ----———————————————〈 E V E N T - L I S T E N E R 〉———————————————-—--- */
canvas.addEventListener("pointerdown", start, false);
canvas.addEventListener("pointermove", draw, false);
canvas.addEventListener("pointerup", stop, false);
canvas.addEventListener("pointerout", stop, false);

/* ----———————————————〈 F U N C T I O N S 〉———————————————-—--- */

/*———————————---------* START *---------———————————*/
function start(_event) { // prepare to draw
    isDrawing = true;
    let rect = canvas.getBoundingClientRect();
    context.beginPath();
    context.moveTo(_event.clientX - canvas.getBoundingClientRect().left,
        _event.clientY - canvas.getBoundingClientRect().top);
    _event.preventDefault();
}
/*———————————---------* DRAW *---------————————————*/
function draw(_event) {  // actually draw
    if (isDrawing) {
        context.lineTo(_event.clientX - canvas.getBoundingClientRect().left, // line is drawn where clicked not on full x y axis
            _event.clientY - canvas.getBoundingClientRect().top); // offset = distance between beginning of obj. and clicked point
        context.strokeStyle = drawColor; // defined in
        context.lineWidth = drawWidth;
        context.lineCap = "round"; // stokepath (procreate)
        context.lineJoin = "round";
        context.stroke();
    }
    _event.preventDefault();
}
/*——————————---------* STOP *---------—————————————*/
// Picture is made when stop function is sctivated.
// For each end of stroke Picture / Canvas params are updated
function stop(_event) {
    if (isDrawing) {
        context.stroke();
        context.closePath();
        isDrawing = false;
    }
    _event.preventDefault();

    if (_event.type !== "pointerout") {
        restoreArray.push(context.getImageData(0, 0, canvas.width, canvas.height));
        index += 1;
        // console.log(restoreArray);
    }
    // Picture is converted to URL Params und communicated to server with emit
    socket.emit('img', {img: canvas.toDataURL()});
}

/*——————————---------* CLEAR *---------————————————*/
function clearCanvas() {
    context.fillStyle = startBackgroundColor;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillRect(0, 0, canvas.width, canvas.height);

    restoreArray = [];
    index = -1;
    console.log("♦—◊—◊〈successfully renewed canvas〉◊—◊—♦");
}
/*——————————---------* UNDO *---------————————————*/
function undoLast() {
    if (index <= 0) {
        clearCanvas();
    } else {
        index -= 1;
        restoreArray.pop();
        context.putImageData(restoreArray[index], 0, 0);
    }
}

// source: G. Rausch
function changeColor(_event) {
    var thisColor = _event.target.getAttribute("datacolor");
    setColor(thisColor);
}
function setColor(color) {
    drawColor = color;
}

