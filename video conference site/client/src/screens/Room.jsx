import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import PeerService from "../service/peer";
import "./room.css"
import Chat from "./Chat"; // Adjust the path as needed

import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {
  const socket = useSocket();
  const peerService = PeerService; // Changed from peerService.peerService to peerService
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [chatMessages, setChatMessages] = useState([]);


  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
 


  const handleVideoButtonClick = async () => {
    if (myStream) {
      await sendStreams();
      myStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOn;
      });
      setIsVideoOn((prev) => !prev); // Toggle the video state
    }
  };

  const handleMicrophoneButtonClick = () => {
    if (remoteSocketId) {
      handleCallUser();
      setIsAudioOn((prev) => !prev); // Toggle the audio state
    }
  };

  useEffect(() => {
    if (myStream) {
      myStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOn;
      });
    }
  }, [isVideoOn, myStream]);

  useEffect(() => {
    if (myStream) {
      myStream.getAudioTracks().forEach((track) => {
        track.enabled = isAudioOn;
      });
    }
  }, [isAudioOn, myStream]);

  const handleNewChatMessage = useCallback((message) => {
    setChatMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peerService.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket, peerService]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peerService.getAnswer(offer); // Use peerService
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket, peerService]
  );

  const sendStreams = useCallback(() => {
    if (myStream) {
      for (const track of myStream.getTracks()) {
        // Check if the track is not already added before adding it
        if (!peerService.peer.getSenders().some(sender => sender.track === track)) {
          peerService.peer.addTrack(track, myStream);
        }
      }
    }
  }, [myStream, peerService]);

  const handleCallAccepted = useCallback(
    ({ ans }) => {
      peerService.setLocalDescription(ans); // Use peerService
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams, peerService]
  );

  useEffect(() => {
    

    peerService.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, [peerService]);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
    };
  }, [socket, handleUserJoined, handleIncommingCall, handleCallAccepted]);

  return (
    <div className="room-container">
      <h1>Room Page</h1>
      <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>
      <div className="control-buttons-container">
        <div className="control-buttons">
          {myStream && <button className="control-button" onClick={sendStreams}>Send Stream</button>}
          {remoteSocketId && <button className="control-button" onClick={handleCallUser}>CALL</button>}
        </div>
      </div>
      <div className="video-container">
        {myStream && (
          <div className="video-box">
            <h1>My Stream</h1>
            <ReactPlayer
              playing
              muted
              height="100%"
              width="100%"
              url={myStream}
            />
          </div>
        )}
        {remoteStream && (
          <div className="video-box">
            <h1>Joined User Stream</h1>
            <ReactPlayer
              playing
              muted
              height="100%"
              width="100%"
              url={remoteStream}
            />
          </div>
        )}
      </div>

      <div className="control-buttons">
        {myStream && (
          <button
            onClick={handleVideoButtonClick}
            className={isVideoOn ? "active" : ""}
          >
            <i className={`fas fa-video${isVideoOn ? "" : "-slash"}`}></i>
          </button>
        )}
        {remoteSocketId && (
          <button
            onClick={handleMicrophoneButtonClick}
            className={isAudioOn ? "active" : ""}
          >
            <i className={`fas fa-microphone${isAudioOn ? "" : "-slash"}`}></i>
          </button>
        )}
      </div>

      <div>
        <Chat messages={chatMessages} onSendMessage={handleNewChatMessage} />
      </div>
    </div>
  );
};

export default RoomPage;