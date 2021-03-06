import React from "react";
import OptionGroup from "../../../components/option/OptionGroup";
import Option from "../../../components/option/Option";
import { Hand, IGolfProperty } from "../../../types/Golfs";
import { IGolfComponentsProps } from "../Right";

const Hands: React.FC<IGolfComponentsProps> = ({
  values,
  onPropertyChange,
  groupStyle,
  optionStyle,
}) => {
  return (
    <OptionGroup
      style={groupStyle}
      name={"Hand"}
      onChange={(value: any) => {
        onPropertyChange(new Hand(value), "hand");
      }}
    >
      {values &&
        values.map(
          (value: IGolfProperty) => (
            <Option
              key={`${value._id}`}
              visualDisabled={value.visualDisabled}
              disabled={value.disabled}
              style={optionStyle}
              value={value}
            >
              {(value as Hand).side}
            </Option>
          ),
          (a: any, b: any) => {
            return a.side.localeCompare(b.side);
          }
        )}
    </OptionGroup>
  );
};

export default Hands;
