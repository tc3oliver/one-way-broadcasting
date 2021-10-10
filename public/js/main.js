// video 標籤
const localVideo = document.querySelector('video#localVideo')

let localStream
let peerConn
let socket

const room = 'room1'

// ===================== 連線相關 =====================
/**
 * 連線 socket.io
 */
function connectIO() {
  // socket
  socket = io('ws://0.0.0.0:8088')


  socket.on('ice_candidate', async (data) => {
    console.log('收到 ice_candidate')
    const candidate = new RTCIceCandidate({
      sdpMLineIndex: data.label,
      candidate: data.candidate,
    })
    await peerConn.addIceCandidate(candidate)
  })

  socket.on('offer', async (desc) => {
    console.log('收到 offer')
    // 設定對方的配置
    await peerConn.setRemoteDescription(desc)

    // 發送 answer
    await sendSDP(false)
  })

  socket.emit('join', room)
}

/**
 * 取得本地串流
 */
async function createStream() {
  try {
    const constraints = {
      audio: true,
      video: true,
    }
    const stream = await navigator.mediaDevices.getUserMedia(constraints)

    localStream = stream

    localVideo.srcObject = stream
  } catch (err) {
    throw err
  }
}

/**
 * 初始化Peer連結
 */
function initPeerConnection() {
  const configuration = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
    ],
  }
  peerConn = new RTCPeerConnection(configuration)

  // 增加本地串流
  localStream.getTracks().forEach((track) => {
    peerConn.addTrack(track, localStream)
  })

  // 找尋到 ICE 候選位置後，送去 Server 與另一位配對
  peerConn.onicecandidate = (e) => {
    if (e.candidate) {
      console.log('發送 ICE')
      // 發送 ICE
      socket.emit('ice_candidate', room, {
        label: e.candidate.sdpMLineIndex,
        id: e.candidate.sdpMid,
        candidate: e.candidate.candidate,
      })
    }
  }

  // 監聽 ICE 連接狀態
  peerConn.oniceconnectionstatechange = (e) => {
    if (e.target.iceConnectionState === 'disconnected') {
      console.log("remote disconnected");
    }
  }
}

/**
 * 處理信令
 * @param {Boolean} isOffer 是 offer 還是 answer
 */
async function sendSDP(isOffer) {
  try {
    if (!peerConn) {
      initPeerConnection()
    }

    // 創建SDP信令
    const localSDP = await peerConn[isOffer ? 'createOffer' : 'createAnswer']({
      offerToReceiveAudio: true, // 是否傳送聲音流給對方
      offerToReceiveVideo: true, // 是否傳送影像流給對方
    })

    // 設定本地SDP信令
    await peerConn.setLocalDescription(localSDP)

    // 寄出SDP信令
    let e = isOffer ? 'offer' : 'answer'
    socket.emit(e, room, peerConn.localDescription)
  } catch (err) {
    throw err
  }
}


/**
 * 初始化
 */
async function init() {
  await createStream()
  initPeerConnection()
  connectIO()
}



// ===================== 監聽事件 =====================
/**
 * 監聽按鈕點擊
 */
startBtn.onclick = init


