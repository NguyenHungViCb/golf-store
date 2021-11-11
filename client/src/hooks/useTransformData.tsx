import { type } from "os";
import {
  Hand,
  Loft,
  Flex,
  Shaft,
  Variant,
  IGolfProperty,
  TransformedData,
  Golf,
} from "../types/Golfs";

export class VariantStore {
  private static instance: VariantStore;

  public variants: Variant[] | any = [];
  public activeVariants: Variant[] | any = this.variants;
  public disabledVariants: Variant[] | any = [];
  public choosenVariant: Variant = new Variant({
    hand: null,
    loft: null,
    flex: null,
    shaft: null,
  });

  public transformedData: TransformedData = new TransformedData();

  private constructor() {}

  public static getInstance(): VariantStore {
    if (!this.instance) {
      this.instance = new VariantStore();
    }
    return this.instance;
  }
}

const transform = (value: IGolfProperty | any) => {
  let propertyName = value.constructor.name.toLowerCase() + "s";
  var instance = VariantStore.getInstance();
  // Check if transformed data already have current property
  //@ts-ignore
  if (!instance.transformedData[propertyName].get(value._id)) {
    //@ts-ignore
    instance.transformedData[propertyName].set(value._id, {
      ...value,
      disabled: false,
    });
  }
};

const transformCaller = () => {
  var instance = VariantStore.getInstance();
  instance.variants.forEach((variant: Variant) => {
    transform(variant.hand);
    transform(variant.loft);
    transform(variant.flex);
    transform(variant.shaft);
  });
};

export const transformData = (data: any): TransformedData => {
  var instance = VariantStore.getInstance();

  data.forEach((variant: any) => {
    instance.variants.push(
      new Variant({
        _id:variant._id,
        hand: new Hand({ ...variant.hand }),
        loft: new Loft({ ...variant.loft }),
        flex: new Flex({ ...variant.flex }),
        shaft: new Shaft({ ...variant.shaft }),
        stock: variant.stock,
      })
    );
  });
  transformCaller();
  return instance.transformedData;
};