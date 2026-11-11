import { Composition } from "remotion";
import { ChatbotAd, AD_DURATION } from "./ChatbotAd";
import { DesignAd, DESIGN_DURATION } from "./DesignAd";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ChatbotAd"
        component={ChatbotAd}
        durationInFrames={AD_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="DesignAd"
        component={DesignAd}
        durationInFrames={DESIGN_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
