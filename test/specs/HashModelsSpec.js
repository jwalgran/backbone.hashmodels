describe('Backbone.HashModels', function(){
    beforeEach(function(){
        var self = this;
        window.HASH_VALUE = undefined;
        Backbone.HashModels.init({
            hashUpdateCallback: function (hash) {
                window.HASH_VALUE = hash;
                console.log('HASH_VALUE=' + hash);
            },
            setupHashMonitorCallback: function(cb) {
                self.setNewHashValue = cb;
            }
        });
    });

    it('exists', function(){
        expect(Backbone).toBeDefined();
        expect(Backbone.HashModels).toBeDefined();
    });

    it("has an init method", function() {
        expect(Backbone.HashModels.init).toBeAFunction();
    });

    describe('addModel', function() {
        it('exists', function() {
            expect(Backbone.HashModels.addModel).toBeAFunction();
        });

        it('throws when adding a model without an id', function(){
            var m = new Backbone.Model({});
            expect(function(){ Backbone.HashModels.addModel(m); }).toThrow();
        });

        it('returns the id of the model', function(){
            var m = new Backbone.Model({id: 'foo'});
            expect(Backbone.HashModels.addModel(m)).toEqual('foo');
        });

        it('accepts an id property string as a second argument', function(){
            var m = new Backbone.Model({});
            expect(Backbone.HashModels.addModel(m, 'foo')).toEqual('foo');
        });

        it('accepts an id property from a hash passed as a second argument', function(){
            var m = new Backbone.Model({});
            expect(Backbone.HashModels.addModel(m, {id: 'foo'})).toEqual('foo');
        });

        it('overrides the model id with the option id', function(){
            var m = new Backbone.Model({id: 'foo'});
            expect(Backbone.HashModels.addModel(m, 'bar')).toEqual('bar');
        });

        it('throws when adding a second model with the same id', function(){
            var a = new Backbone.Model({id: 'foo'});
            var b = new Backbone.Model({id: 'foo'});
            Backbone.HashModels.addModel(a);
            expect(function(){ Backbone.HashModels.addModel(b); }).toThrow();
        });
    });

    it('sets the hash when a model is changed', function () {
        var m = new Backbone.Model({foo: 'bar'});
        Backbone.HashModels.addModel(m, 'test-model');
        expect(window.HASH_VALUE).not.toBeDefined();
        m.set('foo', 'baz');
        expect(window.HASH_VALUE).toBeDefined();
    });

    it('updates a model when a hash is changed', function () {
        var m = new Backbone.Model({foo: 'bar'});
        Backbone.HashModels.addModel(m, 'test-model');
        this.setNewHashValue('eyJ0ZXN0LW1vZGVsIjrEgGZvb8SMImJheiJ9fQ==');
        expect(m.attributes).toEqual({foo: 'baz'});
    });

    it('only updates the hash when a listened property is changed', function () {
        var m = new Backbone.Model({foo: 'bar', monkey: 'fight'});
        Backbone.HashModels.addModel(m, {
            id: 'test-model',
            attributes: ['monkey']
        });
        expect(window.HASH_VALUE).not.toBeDefined();
        m.set('foo', 'baz');
        expect(window.HASH_VALUE).not.toBeDefined();
    });

    it('handles multiple models', function () {
        var dog = new Backbone.Model({sound: 'woof'});
        Backbone.HashModels.addModel(dog, 'dog');
        var cat = new Backbone.Model({sound: 'meow'});
        Backbone.HashModels.addModel(cat, 'cat');
        expect(window.HASH_VALUE).not.toBeDefined();
        dog.set('name', 'Ira');
        expect(window.HASH_VALUE).toEqual('eyJkb2ciOsSAc291bmTEhSJ3b29mIiwibmFtZcSNSXJhIn19');
        cat.set('color', 'grey');
        expect(window.HASH_VALUE).toEqual('eyJkb2ciOsSAc291bmTEhSJ3b29mIiwibmFtZcSNSXJhIn3ElGNhdMSFxIfEicSLxI3EmG93xJMiY29sb3LEjWdyZXnEnn0=');
    });

    it('resets to initial state when hash is cleared', function () {
        var m = new Backbone.Model({foo: 'bar', monkey: 'fight'});
        Backbone.HashModels.addModel(m, 'test-model');
        expect(window.HASH_VALUE).not.toBeDefined();
        m.set({foo: 'baz', rocket: 'blast'});
        expect(window.HASH_VALUE).toBeDefined();
        expect(m.attributes).toEqual({foo: 'baz', monkey: 'fight', rocket: 'blast'});
        this.setNewHashValue('');
        expect(m.attributes).toEqual({foo: 'bar', monkey: 'fight', rocket: 'blast'});
    });

    it('will call a getState method on add', function () {
        var Person = Backbone.Model.extend({
            getState: function () {}
        });
        var p = new Person({'name': 'Nobody'});
        spyOn(p, 'getState');
        Backbone.HashModels.addModel(p, 'test-model');
        expect(p.getState).toHaveBeenCalled();
    });

    it('will call a getState method on change, if available', function () {
        var Person = Backbone.Model.extend({
            getState: function () {
                return { personName: this.name };
            }
        });
        var p = new Person({'name': 'Nobody'});
        spyOn(p, 'getState');
        Backbone.HashModels.addModel(p, 'test-model');
        p.set('name', 'Justin');
        expect(p.getState.callCount).toEqual(2);
    });

    it('will call a setState method if available', function () {
        var Person = Backbone.Model.extend({
            setState: function (state) {}
        });
        var p = new Person({'name': 'Nobody'});
        spyOn(p, 'setState');
        Backbone.HashModels.addModel(p, 'test-model');
        this.setNewHashValue('eyJ0ZXN0LW1vZGVsIjrEgG5hbWXEjCJKdcSEaW4ifX0=');
        expect(p.setState).toHaveBeenCalled();
    });

    it('will use getState and setState to manage persistance', function() {
        var Person = Backbone.Model.extend({
            getState: function () {
                return { personName: this.get('name') };
            },
            setState: function (state) {
                this.set('name', state.personName);
            }
        });
        var p = new Person({'name': 'Nobody'});
        Backbone.HashModels.addModel(p, 'test-model');
        this.setNewHashValue('eyJ0ZXN0LW1vZGVsIjrEgHBlcnNvbk5hbWXEjCJKdcSEaW4ifX0=');
        expect(p.get('name')).toEqual('Justin');
    });

    it('triggers a change event when the hash changes', function(){
        var test = this;
        var m = new Backbone.Model({foo: 'bar', monkey: 'fight'});
        Backbone.HashModels.addModel(m, 'test-model');
        test.hash = '';
        Backbone.HashModels.on('change', function(hash) {
            test.hash = hash;
        });
        runs(function(){
            m.set('foo', 'baz');
        });
        runs(function() {
            expect(test.hash).toEqual('eyJ0ZXN0LW1vZGVsIjrEgGZvb8SMImJheiIsIsSHbmtlecSSZmlnaHQifX0=');
        });
    });

    it('does not update the hash if updateOnChange is false', function(){
        Backbone.HashModels.init({
            updateOnChange: false
        });
        var m = new Backbone.Model({foo: 'bar', monkey: 'fight'});
        Backbone.HashModels.addModel(m, 'test-model');
        var callback = jasmine.createSpy('hash change callback');
        Backbone.HashModels.on('change', callback);
        runs(function(){
            m.set('foo', 'baz');
        });
        runs(function() {
            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('update method', function(){
        it('exists', function(){
            expect(Backbone.HashModels.update).toBeAFunction();
        });

        it('updates the hash when called', function(){
            Backbone.HashModels.init({
                updateOnChange: false
            });
            var m = new Backbone.Model({foo: 'bar', monkey: 'fight'});
            Backbone.HashModels.addModel(m, 'test-model');
            var callback = jasmine.createSpy('hash change callback');
            Backbone.HashModels.on('change', callback);

            runs(function(){
                m.set('foo', 'baz');
            });
            runs(function() {
                expect(callback).not.toHaveBeenCalled();
            });

            runs(function(){
                m.set('monkey', 'calm');
            });
            runs(function() {
                expect(callback).not.toHaveBeenCalled();
            });

            runs(function() {
                Backbone.HashModels.update();
            });
            runs(function() {
                expect(callback).toHaveBeenCalledWith('eyJ0ZXN0LW1vZGVsIjrEgGZvb8SMImJheiIsIsSHbmtlecSSY2FsbSJ9fQ==');
            });
        });
    });
} );