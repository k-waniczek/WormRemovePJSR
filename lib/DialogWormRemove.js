function WormRemoveDialog() {
    this.__base__ = Dialog;
    this.__base__();

    //Set Dialog Width and Height
    this.width = 450;
    this.minWidth = 450;
    this.height = 400;
    this.minHeight = 400;

    //The Main instructional textbox
    this.title = new TextBox(this);
    this.title.text = "<b>Worm Removal Script</b> <br><br>" +
        "Script uses BlurXterminator and StarXterminator in the correct orders as to minimize the occurance of \"worms\" in images after star removal";

    this.title.readOnly = true;
    this.title.minHeight = 90;
    this.title.maxHeight = 90;

    this.sharpenStars = new NumericControl(this);
    with(this.sharpenStars) {
        label.text = "Sharpen stars:";
        setPrecision(2);
        slider.setRange(0, 700);
        setRange(0.0, 0.7);
        setValue(xtParameters.sharpenStars);
        toolTip = "<p>Sharpen stars parameter from BlurXterminator</p>";
        onValueUpdated = function (value) { xtParameters.sharpenStars = value };
    }

    this.sharpenNonStellar = new NumericControl(this);
    with(this.sharpenNonStellar) {
        label.text = "Sharpen nonstellar:";
        setPrecision(2);
        slider.setRange(0, 100);
        setRange(0.0, 1.0);
        setValue(xtParameters.sharpenNonstellar);
        toolTip = "<p>Sharpen nonstellar parameter from BlurXterminator</p>";
        onValueUpdated = function (value) { xtParameters.sharpenNonstellar = value };
    }

    this.adjustHalos = new NumericControl(this);
    with(this.adjustHalos) {
        label.text = "Adjust halos:";
        setPrecision(2);
        slider.setRange(0, 100);
        setRange(-0.5, 0.5);
        setValue(xtParameters.adjustHalos);
        toolTip = "<p>Adjust halos parameter from BlurXterminator</p>";
        onValueUpdated = function (value) { xtParameters.adjustHalos = value };

    }

    this.largeOverlap = new CheckBox(this);
    with(this.largeOverlap) {
        text = "Large overlap";
        checked = xtParameters.overlap ? true : false;
        toolTip = "<p>Large overlap option in StarXterminator";
        onCheck = function (value) { xtParameters.overlap = value ? 0.5 : 0.2 };
    }

    this.correctFirst = new CheckBox(this);
    with(this.correctFirst) {
        text = "Correct first";
        checked = xtParameters.correct;
        toolTip = "<p>Correct first option in BlurXterminator";
        onCheck = function (value) { xtParameters.correct = value };
    }

    this.viewToEdit = new ViewList(this);
    this.viewToEdit.getMainViews();
    this.viewToEdit.onViewSelected = function(view) {
        xtParameters.view = view;
    }

    //Execute Button
    this.execButton = new PushButton(this);
    this.execButton.text = "Execute";
    this.execButton.width = 40;
    this.execButton.enabled = true;
    this.execButton.onClick = () => {
        this.ok();
    }

    this.viewGroupSizer = new VerticalSizer;
    this.viewGroupSizer.margin = 10;
    this.viewGroupSizer.add(this.viewToEdit);
    this.viewGroup = new GroupBox(this);
    this.viewGroup.title = "View";
    this.viewGroup.sizer = this.viewGroupSizer;

    //BlulXterminator and StarXterminator parameters page
    this.xtvsizer = new VerticalSizer;
    this.xtvsizer.margin = 10;
    this.xtvsizer.add(this.sharpenStars);
    this.xtvsizer.addSpacing(5);
    this.xtvsizer.add(this.sharpenNonStellar);
    this.xtvsizer.addSpacing(5);
    this.xtvsizer.add(this.adjustHalos);
    this.xtvsizer.addSpacing(10);
    this.xtvsizer.add(this.largeOverlap);
    this.xtvsizer.addSpacing(10);
    this.xtvsizer.add(this.correctFirst);
    this.xtvsizer.addSpacing(5);
    this.xtGroup = new GroupBox(this);
    this.xtGroup.title = "BlurXterminator and StarXterminator parameters";
    this.xtGroup.sizer = this.xtvsizer;

    //Bottom Buttons
    this.bottomSizer = new HorizontalSizer;
    this.bottomSizer.margin = 8;
    this.bottomSizer.add(this.execButton);


    this.sizer = new VerticalSizer;
    this.sizer.margin = 8;
    this.sizer.add(this.title);
    this.sizer.addSpacing(8);
    this.sizer.add(this.viewGroup);
    this.sizer.addSpacing(8);
    this.sizer.add(this.xtGroup);
    this.sizer.addSpacing(8);
    this.sizer.add(this.bottomSizer);
    this.sizer.addStretch();
}

WormRemoveDialog.prototype = new Dialog;