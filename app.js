const PHONE_IP =
"http://192.168.100.7:8080";

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

video.src = PHONE_STREAM;



function setConnected(){

    cameraConnected = true;

    cameraStatus.textContent =
    "Connected and Active";

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

    if(name !== announcedObject){

        speechSynthesis.cancel();

        const speech =
        new SpeechSynthesisUtterance(
            `${name} detected`
        );

        speech.lang =
        "en-US";

        speechSynthesis.speak(
            speech
        );

        announcedObject = name;
    }
}



async function loadModel(){

    model =
    await cocoSsd.load();

    detectObjects();
}

loadModel();



function detectObjects(){

    canvas.width = 640;
    canvas.height = 480;

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
                predictions[0].score > 0.60
            ){

                const best =
                predictions[0];

                objectName.textContent =
                best.class;

                const confidence =
                (
                    best.score * 100
                ).toFixed(1);



                ctx.beginPath();

                ctx.rect(
                    best.bbox[0],
                    best.bbox[1],
                    best.bbox[2],
                    best.bbox[3]
                );

                ctx.lineWidth = 4;

                ctx.strokeStyle =
                "#ff0000";

                ctx.stroke();



                ctx.fillStyle =
                "#ff0000";

                ctx.font =
                "bold 28px Arial";

                ctx.fillText(

                    `${best.class.toUpperCase()} ${confidence}%`,

                    best.bbox[0],

                    best.bbox[1] - 15
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

    },500);
}