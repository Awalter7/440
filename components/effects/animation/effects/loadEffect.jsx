import Effect from "./effect";

export default class LoadEffect extends Effect {
  constructor(props = {}) {
    super(props);

    this._type = "load";
    this._loaded = false;
  }

  // getter/setter
  get type() {
    return this._type;
  }

  set type(value){
    this._type = value;
  }

  get loaded() {
    return this._loaded;
  }

  set loaded(value) {
    this._loaded = value;
  }

}
