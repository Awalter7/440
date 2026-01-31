import Effect from "./effect";

export default class ValueChangeEffect extends Effect{
    constructor(props = {}){
        super(props)

        this._type = "value";
        this.loop = true;
        this.useOldValue = props.useOldValue ?? false;

        this._useSpecificProp = props.useSpecificProp ?? false;
        this._propToUse = props.propToUse ?? null;

        this._values = null;
        this._setValues = props.setValues ?? null;

        this._oldValues = null;
        this._setOldValues = props.setOldValues ?? null;

        this._customValues = props.customValues ?? null;
    }

    get type(){
        return this._type;
    }

    set type(value){
        this._type = value;
    }

    get customValues(){
        return this._customValues;
    }

    set customValues(values){
        this.checkValueChange(values);
    }

    checkValueChange(values){
        if(!values) return;

        if(this._values === null && this._propToUse && values[this._propToUse] !== undefined){
            this._values = { [this._propToUse]: values[this._propToUse] };
            this._setValues?.(this._values);
            return;
        }

        const nextValues = this._useSpecificProp && this._propToUse
            ? { [this._propToUse]: values[this._propToUse] }
            : { ...values };

        let changed = false;
        for(const key in nextValues){
            if(!this._values || nextValues[key] !== this._values[key]){
                changed = true;
                break;
            }
        }

        if(changed){
            this._oldValues = this._values;
            this._values = nextValues;

            if(this.useOldValue){
                this.start().then(() => {
                    this._setOldValues?.(this._oldValues);
                    this._setValues?.(this._values);
                });
            }else{
                this._setOldValues?.(this._oldValues);
                this._setValues?.(this._values);
                
                this.start()
            }
        }
    }

    
}
