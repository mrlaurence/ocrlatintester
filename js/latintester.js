var latinTester = (function() {
    'use strict';

    //Functions here are accessible from inside the module only

    //General-purpose variables accessible from everywhere within this module
    var vocabDictionary = {},
        vocabKeyArray,
        currentKeyArrayIndex,
        questionCount = 0,
        correctCount = 0,
        promptWithLatin;

    //Variables pointing to HTML elements accessible from everywhere this module
    var startTestButton,
        testOptionsContainer,
        promptLanguageSelect,
        vocabularyListSelect,
        testContainer,
        definedListWarning,
        testWord,
        translationInput,
        submitButton,
        correctStatusText,
        continueButton,
        progressStatusText;

    function setupElements() {
        startTestButton = document.getElementById("start-button");
        testOptionsContainer = document.getElementById("test-options-container");
        promptLanguageSelect = document.getElementById("prompt-language-select");
        vocabularyListSelect = document.getElementById("vocabulary-list-select");
        testContainer = document.getElementById("test-container");
        definedListWarning = document.getElementById("defined-list-warning");
        testWord = document.getElementById("test-word");
        translationInput = document.getElementById("translation-input");
        submitButton = document.getElementById("submit-button");
        continueButton = document.getElementById("continue-button");
        correctStatusText = document.getElementById("correct-status");
        progressStatusText = document.getElementById("progress-status");
    }

    //Parses the text from the vocabulary text file by creating a vocab dictionary
    function parseVocabFileText(vocabFileText) {

        /*
        The text that is imported directly from the vocabulary file follows the following structure:

        Latin Word   How the word declines/conjugates   English translation   Included in Restricted Vocabulary List? (Y/N)
        Latin Word 2   How the word declines/conjugates   English translation   Included in Restricted Vocabulary List? (Y/N)

        Each word with its corresponding values is on a seperate line and each of the values is seperated by a tab. The tabs cause 'columns' within the text to be formed.

        Two examples of a line of the file:
        alius   alia, aliud   other, another, else   N
        clamo   clamare, clamavi, clamatus   shout   Y


        The vocab dictionary follows the following structure:

        {"latin_word_1": ["english_translation_1", "english_translation_2", "etc."],
         "latin_word_2": ["english_translation_1", "english_translation_2", "etc."]
        }

        Two examples of key/value pairs:
        {"ars": ["art, skill"],
         "aqua": ["water"]
        }
        */

        //The script will now check which vocabulary lists will be imported to the vocab dictionary and which language the user wishes to translate words from
        var importRestrictedListOnly;

        switch(promptLanguageSelect.options[promptLanguageSelect.selectedIndex].value) {
            case "Latin":
                promptWithLatin = true;
                break;

            case "English":
                promptWithLatin = false;
                break;
        }

        switch(vocabularyListSelect.options[vocabularyListSelect.selectedIndex].value) {
            case "Defined Vocabulary List":
                importRestrictedListOnly = false;
                break;

            case "Restricted Vocabulary List":
                importRestrictedListOnly = true;
                break;
        }

        if (!promptWithLatin && !importRestrictedListOnly) {
            //The user has opted to translate from English to Latin with the Defined Vocabulary List so show the warning that this is not assessed by OCR
            definedListWarning.style.display = "block";
        }

        //The script will now parse the vocab file
        var tabCount = 0,
            latinWord = "",
            currentEnglishTranslation = "",
            englishTranslations = [],
            currentChar,
            willImportBasedOnVocabList = false;

        for (var i = 0; i <= vocabFileText.length -1; i+= 1) {
            currentChar = vocabFileText.charAt(i);

            if (currentChar === '\n' || vocabFileText.length === i + 1) {
                //The script has reached a new line character or the last character in the text so the script needs to add the result of parsing the line to the vocab dictionary, if appropriate according to the tier(s) and AO(s) selected by the user

                if (willImportBasedOnVocabList) {
                    vocabDictionary[latinWord.trim()] = englishTranslations;
                }

                //Set all the variables used while parsing the line back to their original values so the script can use them for the next line
                tabCount = 0;
                latinWord = "";
                currentEnglishTranslation = "";
                englishTranslations = [];
                willImportBasedOnVocabList = false;
            }
            else if (currentChar === '\t') {
                tabCount += 1;
            }
            else {
                switch(tabCount) {
                    //tabCount is always one less than the number of the column currently being processed

                    case 0:
                        //The first column contains the Latin word
                        latinWord += currentChar;
                        break;

                    //The vocabulary tester does not use the second column, which contains the way the Latin word declines/conjugates
                    case 2:
                        //The third column contains the English translation

                        if (currentChar === ',') {
                            englishTranslations.push(currentEnglishTranslation.trim());
                            currentEnglishTranslation = "";
                        }
                        else if (vocabFileText.charAt(i+1) === '\t') {
                                //This is the last character in the English translations column of text so the script needs to add the last English translation to the array once it has added the final character of that translation
                                currentEnglishTranslation += currentChar;
                                englishTranslations.push(currentEnglishTranslation.trim());
                        }
                        else {
                            currentEnglishTranslation += currentChar;
                        }
                        break;

                    case 3:
                        //The fourth column contains either Y or N to indicate whether the word is in the Restricted Vocabulary List

                        if (!importRestrictedListOnly) {
                            //The Defined Vocabulary List is being used so all words are imported
                            willImportBasedOnVocabList = true;
                        }
                        else if (currentChar === 'Y' && importRestrictedListOnly) {
                            //The Restricted Vocabulary List is being used so the word is only imported if it is in this list (indicated by a 'Y')
                            willImportBasedOnVocabList = true;
                        }
                        break;

                }
            }
        }

        //After the script finishes parsing the text from the vocab file, the script adds the keys (which are the Latin versions of the words) from the vocab dictionary to an array so it can use them later
        vocabKeyArray = Object.keys(vocabDictionary);
    }

    //Runs when the user submits their attempted translation. Modifies the correct status text element to inform the user as to whether their attempted translation was correct or incorrect
    function setCorrectStatus(isCorrect) {
        var statusInnerHtml,
            statusColour;

        function changeCorrectStatusTextElement(innerHtml, colour) {
            correctStatusText.innerHTML = statusInnerHtml;
            correctStatusText.style.color = statusColour;
            correctStatusText.style.display = "block";
        }

        if (isCorrect) {

            //The script informs the user they were correct and continues to test them on another word
            statusInnerHtml = "Correct";
            statusColour = "#18B495";

            changeCorrectStatusTextElement(statusInnerHtml, statusColour);

            latinTester.changeWord();

            //After a short delay, hide the element with the text that informs the user as to whether they are correct or not
            setTimeout(function () {
                correctStatusText.style.display = "none";
            }, 300);
        }
        else {

            //The script informs the user they were incorrect and does not continue to test them on another word until they click the continue button. Instead, it displays the correct translations(s)

            //Get an array of correct translations
            if (promptWithLatin) {
              //The correct translations are the English versions of the word when translating from Latin
              var correctTranslations = vocabDictionary[vocabKeyArray[currentKeyArrayIndex]];
            }
            else {
               //The only correct translation is the Latin version of the word when translating from English
               var correctTranslations = [vocabKeyArray[currentKeyArrayIndex]];
            }

            //Compile a string of all the correct translations from the array seperated by commas
            var correctTranslationsString = "";

            for (var i = 0; i < correctTranslations.length; i += 1) {
                correctTranslationsString += correctTranslations[i];

                if (i + 1 != correctTranslations.length) {
                    correctTranslationsString += ", ";
                }
            }
            statusInnerHtml = "Incorrect - " + correctTranslationsString;
            statusColour = "#E74C3C";
            changeCorrectStatusTextElement(statusColour, statusColour);

            //Replace the translation input field and the submit button
            submitButton.style.display = "none";
            translationInput.style.display = "none";
            continueButton.style.display = "inline";

            //Focus the continue button after waiting 10 miliseconds to prevent the user accidentally pressing Enter
            setTimeout(function () {
                continueButton.focus();
            }, 10);
        }
    }


    //Runs when the user submits their attempted translation. Modifies the progress status text element to inform the user as to how many questions the user has answered correctly and how many in total
    function setProgressStatus(isCorrect) {
        questionCount += 1;

        if (isCorrect) {
            correctCount += 1;
        }

        progressStatusText.innerHTML = sprintf("Progress - %d/%d", correctCount, questionCount);
    }

    return {
        //Functions here are accessible inside and outside the module

        //Run when the user starts the test. The purpose of this function is to setup the test by hiding the test options, get the text from the vocabulary file, call the function to parse the vocabulary file text, etc.
        startTest: function() {
            setupElements();

            //Don't display elements that are no longer needed
            testOptionsContainer.style.display = "none";
            startTestButton.style.display = "none";

            //Display the actual test interface
            testContainer.style.display = "block";

            //Get the text from the vocabulary file
            var xhr = new XMLHttpRequest();

            function handleStateChange() {
                if (xhr.readyState === 4) {

                    //Once the script has the text, parse it
                    parseVocabFileText(xhr.responseText);

                    //Now that the script has compiled the vocab dictionary, it can start testing by displaying a Latin/English word to the user
                    latinTester.changeWord();
                }
            }
            xhr.onreadystatechange = handleStateChange;
            xhr.open("GET", "txt/vocabulary-data.txt", true);
            xhr.send();
        },

        //Change the word the user is being tested on
        changeWord: function() {
            currentKeyArrayIndex = Math.floor(Math.random() * (vocabKeyArray.length));

            if (promptWithLatin) {
                //Prompt the user with the Latin word when translating from Latin
                var promptText = vocabKeyArray[currentKeyArrayIndex];
            }
            else {
                //Prompt the user with the English versions of the word when translating from English
                var englishVersions = vocabDictionary[vocabKeyArray[currentKeyArrayIndex]];

                //Compile a string of all the English versions from the array seperated by commas
                var promptText = "";

                for (var i = 0; i < englishVersions.length; i += 1) {
                  promptText += englishVersions[i];
                  if (i != englishVersions.length - 1) {
                    promptText += ", ";
                  }
                }
            }

            testWord.innerHTML = promptText;

            //Blank the input box for the translation and return the focus to it
            translationInput.value = "";
            translationInput.focus();
        },

        //Determine whether the user's attempted translation is correct
        validateTranslationAttempt: function() {
            var userTranslation = translationInput.value.toLowerCase(),
            correctTranslations,
            lowerCorrectTranslations = [];

            //Get an array of correct translations for the word the user is being tested on
            if (promptWithLatin) {
              //The correct translations are the English versions of the word when translating from Latin
              correctTranslations = vocabDictionary[vocabKeyArray[currentKeyArrayIndex]];
            }
            else {
               //The only correct translation is the Latin version of the word when translating from English
               correctTranslations = [vocabKeyArray[currentKeyArrayIndex]];
            }

            for (var i = 0; i < correctTranslations.length; i += 1) {
                lowerCorrectTranslations[i] = correctTranslations[i].toLowerCase();
            }

            //Check whether the user's translation is in the array of valid translation(s) for the word the user is being tested on
            if (lowerCorrectTranslations.indexOf(userTranslation) > -1) {
                //It is in the array - the user was correct

                //Inform them they were correct
                setCorrectStatus(true);

                //Update the user's progress
                setProgressStatus(true);
            }
            else {
                //It is not in the array - the user was incorrect

                //Inform them they were incorrect and of the correct translation(s) for the word
                setCorrectStatus(false);

                //Update the user's progress
                setProgressStatus(false);
            }
        },

        //Runs after the user presses the continue button after they have translated a word incorrectly and are being prompted with the correct translation(s). This function resumes the test by prompting the user with another word to translate as well as removing the correct status text and continue button
        continueTest: function() {
            continueButton.style.display = "none";
            submitButton.style.display = "inline";
            submitButton.style.display = "inline";
            translationInput.style.display = "inline";
            correctStatusText.style.display = "none";
            latinTester.changeWord();
        },

        //Runs when the user presses a key when certain elements are in focus. The purpose of this function is to simulate a click on the element that was in focus if it was the Return key that was pressed
        keyPress: function(event, source) {

            if (event.keyCode === 13) {
                //The Return key was pressed
                switch (source) {
                    case "translation-input":
                        submitButton.click();
                        break;
                }
            }
            return false;
        }
    };
}());
