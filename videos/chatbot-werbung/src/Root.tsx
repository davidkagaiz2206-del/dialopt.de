import { Composition } from "remotion";
import { ChatbotAd, AD_DURATION } from "./ChatbotAd";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ChatbotAd"
      component={ChatbotAd}
      durationInFrames={AD_DURATION}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
