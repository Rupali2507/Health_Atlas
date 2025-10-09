package com.healthatlas.spring.helper;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.web.multipart.MultipartFile;

import com.healthatlas.spring.model.DataModel;

public class CSVHelper {
  public static String TYPE = "text/csv";
  static String[] HEADERs = { "npi", "full_name", "address", "city", "state", "zip_code", "phone_number" };

  public static boolean hasCSVFormat(MultipartFile file) {

    if (!TYPE.equals(file.getContentType())) {
      return false;
    }

    return true;
  }

  public static List<DataModel> csvToDataModels(InputStream is) {
    try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(is, "UTF-8"));
        CSVParser csvParser = new CSVParser(fileReader,
            CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim());) {
                List<DataModel> datamodels = new ArrayList<>();
                Iterable<CSVRecord> csvRecords = csvParser.getRecords();

      for (CSVRecord csvRecord : csvRecords) {
        DataModel datamodel = new DataModel(
            csvRecord.get("npi"),          // Assuming npi is String; parse if needed
            csvRecord.get("full_name"),
            csvRecord.get("address"),
            csvRecord.get("city"),
            csvRecord.get("state"),
            csvRecord.get("zip_code"),
            csvRecord.get("phone_number")
            );

        datamodels.add(datamodel);
      }

      return datamodels;
    } catch (IOException e) {
      throw new RuntimeException("fail to parse CSV file: " + e.getMessage());
    }
  }

}
