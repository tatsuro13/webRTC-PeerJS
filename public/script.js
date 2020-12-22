const socket = io("/");
const videoWrap = document.getElementById("video__wrap");
const myPeer = new Peer();

const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};
let myVideoStream;
const user = {};
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
      call.on("close", () => {
        video.remove();
      });

      peers[call.peer] = call;
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

myPeer.on("disconnected", (id) => {
  console.log("disconnected");
});

const connectToNewUser = (userId, stream) => {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });
  peers[call.peer] = call;
};

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoWrap.append(video);
};

const muteUnmute = (e) => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    e.classList.add("active");
    myVideoStream.getAudioTracks()[0].enabled = false;
  } else {
    e.classList.remove("active");
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const playStop = (e) => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    e.classList.add("active");
    myVideoStream.getVideoTracks()[0].enabled = false;
  } else {
    e.classList.remove("active");
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const leaveVideo = (e) => {
  socket.disconnect();
  myPeer.disconnect();
  const elms = document.getElementsByTagName("video");
  for (let i = elms.length - 1; i >= 0; --i) {
    elms[i].remove();
  }

  e.classList.add("active");
};
