let audioContext = null;

export function playNotificationSound() {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      880,
      audioContext.currentTime
    );

    gain.gain.setValueAtTime(
      0.001,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.2,
      audioContext.currentTime + 0.05
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.4
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch (error) {
    console.error("Notification sound error:", error);
  }
}