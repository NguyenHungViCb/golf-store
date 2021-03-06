import React, { useContext, useEffect, useRef } from "react";
import { OptionGroupContext } from "./OptionGroup";

interface OptionProps {
  children?: React.ReactNode;
  onClick?: Function;
  visualDisabled?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  value?: any;
  className?: string;
}

const Option: React.FC<OptionProps> = ({
  children,
  onClick,
  visualDisabled,
  disabled,
  style,
  value,
  className
}) => {
  const context = useContext(OptionGroupContext);
  const optionRef = useRef<HTMLDivElement>(null);
  const { setActive, removeActiveSibling, runCallback } = context;

  // Remove v-disabled on option click
  // Set active to the current clicked ref
  const defaultOnClick = () => {
    // This line is to fix glitch issue
    optionRef.current?.classList.add("active")
    setActive(optionRef.current);
    runCallback(value);

    if (optionRef.current?.classList.contains("v-disabled")) {
      optionRef.current?.classList.remove("v-disabled");
    }
  };

  useEffect(() => {
    if (disabled) return;
    if (optionRef.current?.classList.contains("active")) {
      runCallback(value);
    }
  });

  return (
    <div
      className={`option  ${disabled ? "disabled" : visualDisabled ? "v-disabled" : ""
        } ${className ? className : ""}`}
      onClick={(e) => {
        if (!disabled) {
          removeActiveSibling(e);
          defaultOnClick();
          onClick && onClick(value);
        }
      }}
      ref={optionRef}
      style={style}
    >
      {children}
    </div>
  );
};

export default Option;
