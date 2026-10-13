package com.codecademyjava.lessons;

import java.util.regex.Pattern;

public record RequiredCodePattern(String regex, String failureMessage) {

    public boolean isSatisfiedBy(String sourceCode) {
        return Pattern.compile(regex, Pattern.MULTILINE).matcher(sourceCode).find();
    }
}
