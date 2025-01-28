import SidebarAd2 from "../components/sidebarAd2";
import React, { useState, useEffect } from "react";
import { database } from "../firebase.config"; // Import from firebaseconfig.js
import {
  ref,
  query,
  orderByChild,
  equalTo,
  limitToFirst,
  onValue,
  update,
  push,
  remove,
} from "firebase/database";
import '../components/windowAd2.css'

function Window2() {
  const db = database; // Use imported database instance

  // State management
  const [currentQueue, setCurrentQueue] = useState(null);
  const [currentQueueId, setCurrentQueueId] = useState(null);
  const [window2Status, setWindow2Status] = useState("Active");

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = ""; // This triggers the browser's confirmation dialog.
    };

    // Add the event listener
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Fetch the next queue when component mounts
  useEffect(() => {
    fetchNextQueue();
    fetchWindowStatus();
  }, []);

  // Utility function to get a formatted date and time
  const getReadableDateTime = () => {
    const now = new Date();
    const options = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true };
    const formattedDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const formattedTime = now.toLocaleTimeString("en-US", options);
    return `${formattedDate} ${formattedTime}`;
  };

  // Fetch next queue
  const fetchNextQueue = () => {
    setCurrentQueue(null); // Clear current queue data
    const nextQueueQuery = query(
      ref(db, "queues"),
      orderByChild("Status"),
      equalTo("Pending"),
      limitToFirst(1)
    );

    onValue(
      nextQueueQuery,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const firstEntryKey = Object.keys(data)[0];
          setCurrentQueueId(firstEntryKey);

          const queueRef = ref(db, `queues/${firstEntryKey}`);
          const startTime = new Date().toISOString();

          update(queueRef, {
            Status: "Processing",
            StartTime: startTime,
            Window_Received: "Window2",
          })
            .then(() => setCurrentQueue(data[firstEntryKey]))
            .catch((error) => {
              console.error("Error updating queue status:", error);
            });
        } else {
          alert("No more pending queues!");
        }
      },
      { onlyOnce: true }
    );
  };

  // Complete current queue
  const completeCurrentQueue = () => {
    if (!currentQueueId) return;

    if (confirm("Are you sure you want to proceed to the next queue?")) {
      const currentQueueRef = ref(db, `queues/${currentQueueId}`);

      onValue(
        currentQueueRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const currentData = snapshot.val();
            const readableEndTime = getReadableDateTime();
            const startTimeMillis = Date.parse(currentData.StartTime);
            const processingTimeMillis = Date.now() - startTimeMillis;

            if (isNaN(startTimeMillis) || isNaN(processingTimeMillis)) {
              alert("Cannot calculate processing time. StartTime is missing or invalid.");
              return;
            }

            const readableProcessingTime = formatProcessingTime(processingTimeMillis);

            push(ref(db, "CompletedQueues"), {
              ...currentData,
              Status: "Completed",
              Date_and_Time_Completed: readableEndTime, // Formatted date and time
              ProcessingTime: readableProcessingTime,
            }).then(() => {
              remove(currentQueueRef).then(fetchNextQueue);
            });
          }
        },
        { onlyOnce: true }
      );
    }
  };

  // Cancel current queue
  const cancelCurrentQueue = () => {
    if (!currentQueueId) return;

    if (confirm("Are you sure you want to cancel this queue?")) {
      const reason = prompt("Please enter the reason for cancellation:");
      if (reason) {
        const currentQueueRef = ref(db, `queues/${currentQueueId}`);
        const readableEndTime = getReadableDateTime();

        onValue(
          currentQueueRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const currentData = snapshot.val();
              const startTimeMillis = Date.parse(currentData.StartTime);
              const processingTimeMillis = Date.now() - startTimeMillis;

              const readableProcessingTime = !isNaN(processingTimeMillis)
                ? formatProcessingTime(processingTimeMillis)
                : "N/A";

              push(ref(db, "CompletedQueues"), {
                ...currentData,
                Status: "Cancelled",
                CancelReason: reason,
                CompletedTime: readableEndTime, // Formatted date and time
                ProcessingTime: readableProcessingTime,
              }).then(() => {
                remove(currentQueueRef).then(() => {
                  setCurrentQueue(null);
                  fetchNextQueue();
                });
              });
            }
          },
          { onlyOnce: true }
        );
      } else {
        alert("Cancellation reason is required.");
      }
    }
  };

  // Format processing time
  const formatProcessingTime = (milliseconds) => {
    const seconds = Math.floor((milliseconds / 1000) % 60);
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
    const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);

    return `${hours > 0 ? `${hours} hours, ` : ""}${minutes > 0 ? `${minutes} minutes, ` : ""}${seconds} seconds`;
  };

  // Fetch Window2 status
  const fetchWindowStatus = () => {
    const window2Ref = ref(db, "QueueSystemStatus/Window2/Status");
    onValue(window2Ref, (snapshot) => {
      setWindow2Status(snapshot.val());
    });
  };

  // Toggle Window2 status
  const handleToggleStatus = () => {
    const isDisabling = window2Status === "Active";
    const confirmMessage = isDisabling
      ? "Are you sure you want to disable Window 2?"
      : "Do you want to enable Window 2?";

    if (confirm(confirmMessage)) {
      const window2Ref = ref(db, "QueueSystemStatus/Window2");
      const newStatus = isDisabling ? "Inactive" : "Active";

      update(window2Ref, { Status: newStatus })
        .then(() => {
          alert(`Window 2 has been ${newStatus === "Inactive" ? "disabled" : "enabled"}.`);
        })
        .catch((error) => {
          console.error("Error updating status:", error);
          alert("Failed to update Window 2 status. Please try again.");
        });
    }
  };

  return (
    <>
      <SidebarAd2 />
      <div className="win1-container">
        <div className="win-headz">
          <h2 className="win-title">FINANCE WINDOW 2</h2>
          <button className="disable" onClick={handleToggleStatus}>
            {window2Status === "Active" ? "Disable" : "Enable"}
          </button>
        </div>

        <div className="user-container">
          <div className="userInfo-card">
            <div className="user-Info">
              <h3 className="uid">User ID:</h3>
              <span className="userInfo-value">{currentQueue?.UserID || "N/A"}</span>
            </div>
            <div className="user-Info">
              <h3 className="uid">Name:</h3>
              <span className="userInfo-value">{currentQueue?.Name || "N/A"}</span>
            </div>
            <div className="user-Info">
              <h3 className="uid">Email:</h3>
              <span className="userInfo-value">{currentQueue?.Email || "N/A"}</span>
            </div>
            <div className="user-Info">
              <h3 className="uid">Contact:</h3>
              <span className="userInfo-value">{currentQueue?.ContactNumber || "N/A"}</span>
            </div>
            <div className="user-Info">
              <h3 className="uid">Purpose:</h3>
              <span className="userInfo-value">{currentQueue?.Queue_Purpose || "N/A"}</span>
            </div>
            <div className="user-Info">
              <h3 className="uid">Completed Time:</h3>
              <span className="userInfo-value">
                {currentQueue?.CompletedTime ? currentQueue.CompletedTime : "N/A"}
              </span>
              
            </div>
          </div>
        </div>
        <div className="queue-container">
          <div className="q-wrapper">
            <div className="queue-card">
              <h2 className="current-queue">Current Queue:</h2>
              <h2 className="q-num">{currentQueue?.Queue_Number || "N/A"}</h2>
            </div>
          </div>
          <div className="qBtn-container">
            <button className="cancel" onClick={cancelCurrentQueue}>Cancel</button>
            <button className="recall">Recall</button>
            <button className="next" onClick={completeCurrentQueue}>Next Queue</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Window2;
