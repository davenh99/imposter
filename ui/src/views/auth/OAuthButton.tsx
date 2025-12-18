import { Component } from "solid-js";
import { useNavigate } from "@solidjs/router";

import { usePB } from "../../config/pocketbase";
import { Button } from "../../components";

interface Props {
  name: string;
  displayName: string;
}

const OAuthButton: Component<Props> = (props) => {
  const { OAuthSignIn } = usePB();
  const navigate = useNavigate();

  return (
    <Button
      class="w-[95%] mb-3"
      onClick={() => {
        OAuthSignIn(props.name);
        navigate("/");
      }}
    >
      <p>Continue with {props.displayName}</p>
    </Button>
  );
};

export default OAuthButton;
