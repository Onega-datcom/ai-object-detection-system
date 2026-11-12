const PHONE_IP =
"http://192.168.43.248:8080";

const PHONE_STREAM =
PHONE_IP + "/video";

const TEST_IMAGE =
PHONE_IP + "/shot.jpg";

const video =
document.getElementById("video");

const canvas =
document.getElementById("canvas");

const ctx =
canvas.getContext("2d");

const cameraStatus =
document.getElementById("cameraStatus");

const objectName =
document.getElementById("objectName");

const cameraOverlay =
document.getElementById("cameraOverlay");

let model = null;

let cameraConnected = false;

let announcedObject = "";

document.addEventListener(
    "click",
    () => {
        speechSynthesis.resume();
    },
    { once:true }
);

video.src = PHONE_STREAM;

function setConnected(){

    cameraConnected = true;

    cameraStatus.textContent =
    "Connected";

    cameraStatus.className =
    "connected";

    cameraOverlay.style.display =
    "none";
}

function setDisconnected(){

    cameraConnected = false;

    cameraStatus.textContent =
    "Not Connected";

    cameraStatus.className =
    "disconnected";

    objectName.textContent =
    "No Object";

    announcedObject = "";

    cameraOverlay.style.display =
    "flex";
}

function checkConnection(){

    const img = new Image();

    img.onload = () => {

        if(!cameraConnected){

            setConnected();

            video.src =
            PHONE_STREAM +
            "?t=" +
            Date.now();
        }
    };

    img.onerror = () => {

        if(cameraConnected){

            setDisconnected();
        }
    };

    img.src =
    TEST_IMAGE +
    "?t=" +
    Date.now();
}

setInterval(
    checkConnection,
    1000
);

checkConnection();

function speakObject(name){

    if(
        name !== announcedObject &&
        !speechSynthesis.speaking
    ){

        const speech =
        new SpeechSynthesisUtterance(
            `${name} detected`
        );

        speech.lang =
        "en-US";

        speech.rate = 1;

        speech.pitch = 1;

        speech.volume = 1;

        speech.onend = () => {

            announcedObject = name;
        };

        speechSynthesis.speak(
            speech
        );
    }
}

async function loadModel(){

    model =
    await cocoSsd.load();

    detectObjects();

    /*try {

        console.log("Loading model...");

        model = await cocoSsd.load();

        console.log("MODEL LOADED");
        console.log(model);

        detectObjects();

    } catch (error) {

        console.error("MODEL ERROR:", error);

    }*/
}

loadModel();

function detectObjects(){

    canvas.width = video.offsetWidth;
    canvas.height = video.offsetHeight;

    setInterval(async () => {

        if(
            !cameraConnected ||
            !model
        ){
            return;
        }

        try{

            const predictions =
            await model.detect(video);

            ctx.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            if(
                predictions.length > 0 &&
                predictions[0].score > 0.45
            ){

                const best =
                predictions[0];

                objectName.textContent =
                best.class;

                const confidence =
                (
                    best.score * 100
                ).toFixed(1);

                const x =
                Math.max(0, best.bbox[0]);

                const y =
                Math.max(0, best.bbox[1]);

                const width =
                Math.min(
                    best.bbox[2],
                    canvas.width - x
                );

                const height =
                Math.min(
                    best.bbox[3],
                    canvas.height - y
                );

                ctx.strokeStyle =
                "#ff0000";

                ctx.lineWidth = 2;

                ctx.strokeRect(
                    x,
                    y,
                    width,
                    height
                );

                ctx.fillStyle ="#ff0000";

                ctx.fillRect(
                    x,
                    Math.max(0, y - 30),
                    220,
                    28
                );

                ctx.fillStyle ="#ffffff";

                ctx.font ="bold 18px Arial";

                ctx.fillText(

                    `${best.class.toUpperCase()} ${confidence}%`,

                    x,

                    Math.max(25, y - 10)
                );

                speakObject(
                    best.class
                );

            }
            else{

                objectName.textContent =
                "No Object";

                announcedObject =
                "";
            }

        }
        catch(error){

            console.log(error);
        }

    },200);
}