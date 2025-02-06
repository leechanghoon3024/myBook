func decreaseVolumePlayers(duration: TimeInterval, completion: @escaping () -> Void) {
      let dispatchGroup = DispatchGroup()
      // 볼륨 감소 로직을 위한 내부 함수 DispatchGroup을 활용
      func decreaseVolumeGradually(player: AVPlayer, dispatchGroup: DispatchGroup) {
          dispatchGroup.enter()
          let initialVolume = player.volume
          let volumeDecrement = initialVolume / 10.0
          let timeIncrement = duration / 10.0
          var currentVolume = initialVolume
          for i in 1...10 {
              DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * timeIncrement) {
                  currentVolume -= volumeDecrement
                  if currentVolume < 0 { currentVolume = 0 }
                  player.volume = currentVolume
                  if i == 10 {
                      dispatchGroup.leave()
                  }
              }
          }
      }
      decreaseVolumeGradually(player: mainPlayer!, dispatchGroup: dispatchGroup)
      decreaseVolumeGradually(player: subPlayer!, dispatchGroup: dispatchGroup)
      dispatchGroup.notify(queue: .main) {
          completion()
      }
  }