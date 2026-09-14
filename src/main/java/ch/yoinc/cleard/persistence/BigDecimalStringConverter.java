package ch.yoinc.cleard.persistence;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Converter
public class BigDecimalStringConverter implements AttributeConverter<BigDecimal, String> {

    private static final int SCALE = 4;

    @Override
    public String convertToDatabaseColumn(BigDecimal attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.setScale(SCALE, RoundingMode.UNNECESSARY).toPlainString();
    }

    @Override
    public BigDecimal convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return new BigDecimal(dbData);
    }

}
